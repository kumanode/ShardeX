//! Encrypted per-profile account credentials.
//!
//! Passwords are stored with AES-256-GCM under a key derived from a master
//! password (PBKDF2-HMAC-SHA256). The store is locked until `unlock` succeeds;
//! the key never leaves this process and the plaintext password is never
//! serialised to the UI.

use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Nonce};
use anyhow::{Context, Result};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::{OnceLock, RwLock};

const NONCE_LEN: usize = 12;
const SALT_LEN: usize = 16;
const PBKDF2_ITERATIONS: u32 = 120_000;
/// Ciphertext of this constant proves the master password on unlock.
const VERIFY_PLAINTEXT: &[u8] = b"shardx-credential-store-v1";

/// One stored account. `password` is never serialised out of the process.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Credential {
    pub id: String,
    pub profile_id: String,
    pub provider: String,
    pub email: String,
    #[serde(default, skip_serializing)]
    pub password: String,
    #[serde(default)]
    pub notes: Option<String>,
    #[serde(default)]
    pub created_at: u64,
    #[serde(default)]
    pub last_used: u64,
    /// Provider-level session keep-alive, in minutes (0 = off).
    #[serde(default)]
    pub keep_alive_minutes: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderTemplate {
    pub id: String,
    pub name: String,
    pub domains: Vec<String>,
    /// URL pinged by the keep-alive task for this provider.
    pub keep_alive_url: String,
}

// ---- process-global key ----

fn key_cell() -> &'static RwLock<Option<[u8; 32]>> {
    static KEY: OnceLock<RwLock<Option<[u8; 32]>>> = OnceLock::new();
    KEY.get_or_init(|| RwLock::new(None))
}

pub fn is_unlocked() -> bool {
    key_cell().read().map(|k| k.is_some()).unwrap_or(false)
}

pub fn lock() {
    if let Ok(mut k) = key_cell().write() {
        *k = None;
    }
}

fn key() -> Result<[u8; 32]> {
    key_cell()
        .read()
        .ok()
        .and_then(|k| *k)
        .ok_or_else(|| anyhow::anyhow!("credential store is locked"))
}

// ---- storage ----

pub fn db_path() -> Result<PathBuf> {
    Ok(crate::store::settings_path()?.with_file_name("credentials.db"))
}

pub fn is_configured() -> bool {
    db_path().map(|p| p.exists()).unwrap_or(false)
}

fn open() -> Result<Connection> {
    let path = db_path()?;
    let conn = Connection::open(&path).with_context(|| format!("open {}", path.display()))?;
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS credentials (
            id TEXT PRIMARY KEY,
            profile_id TEXT NOT NULL,
            provider TEXT NOT NULL,
            email TEXT NOT NULL,
            password_enc BLOB NOT NULL,
            notes TEXT,
            created_at INTEGER NOT NULL,
            last_used INTEGER NOT NULL,
            keep_alive_minutes INTEGER NOT NULL DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_cred_profile_provider
            ON credentials(profile_id, provider);
        CREATE TABLE IF NOT EXISTS meta (
            key TEXT PRIMARY KEY,
            value BLOB NOT NULL
        );",
    )?;
    // Older stores predate the keep-alive column.
    let _ = conn.execute(
        "ALTER TABLE credentials ADD COLUMN keep_alive_minutes INTEGER NOT NULL DEFAULT 0",
        [],
    );
    Ok(conn)
}

// ---- crypto ----

fn random_bytes(n: usize) -> Result<Vec<u8>> {
    let mut buf = vec![0u8; n];
    getrandom::getrandom(&mut buf).map_err(|e| anyhow::anyhow!("random: {e}"))?;
    Ok(buf)
}

fn derive_key(master: &str, salt: &[u8]) -> [u8; 32] {
    let mut out = [0u8; 32];
    pbkdf2::pbkdf2_hmac::<sha2::Sha256>(
        master.as_bytes(),
        salt,
        PBKDF2_ITERATIONS,
        &mut out,
    );
    out
}

fn encrypt(k: &[u8; 32], plaintext: &[u8]) -> Result<Vec<u8>> {
    let cipher = Aes256Gcm::new_from_slice(k).map_err(|e| anyhow::anyhow!("cipher: {e}"))?;
    let nonce_bytes = random_bytes(NONCE_LEN)?;
    let nonce = Nonce::from_slice(&nonce_bytes);
    let ct = cipher
        .encrypt(nonce, plaintext)
        .map_err(|e| anyhow::anyhow!("encrypt: {e}"))?;
    let mut out = nonce_bytes;
    out.extend_from_slice(&ct);
    Ok(out)
}

fn decrypt(k: &[u8; 32], blob: &[u8]) -> Result<Vec<u8>> {
    if blob.len() <= NONCE_LEN {
        anyhow::bail!("ciphertext too short");
    }
    let cipher = Aes256Gcm::new_from_slice(k).map_err(|e| anyhow::anyhow!("cipher: {e}"))?;
    let (nonce_bytes, ct) = blob.split_at(NONCE_LEN);
    cipher
        .decrypt(Nonce::from_slice(nonce_bytes), ct)
        .map_err(|_| anyhow::anyhow!("decrypt failed"))
}

fn read_meta(conn: &Connection, key_name: &str) -> Result<Vec<u8>> {
    conn.query_row(
        "SELECT value FROM meta WHERE key = ?1",
        params![key_name],
        |r| r.get::<_, Vec<u8>>(0),
    )
    .with_context(|| format!("missing meta '{key_name}'"))
}

// ---- lifecycle ----

/// First-time setup: create the store and lock it under `master`.
pub fn setup(master: &str) -> Result<()> {
    if master.is_empty() {
        anyhow::bail!("master password cannot be empty");
    }
    if is_configured() {
        anyhow::bail!("credential store already exists");
    }
    let conn = open()?;
    let salt = random_bytes(SALT_LEN)?;
    let k = derive_key(master, &salt);
    let verification = encrypt(&k, VERIFY_PLAINTEXT)?;
    conn.execute(
        "INSERT OR REPLACE INTO meta (key, value) VALUES ('salt', ?1)",
        params![salt],
    )?;
    conn.execute(
        "INSERT OR REPLACE INTO meta (key, value) VALUES ('verification', ?1)",
        params![verification],
    )?;
    if let Ok(mut cell) = key_cell().write() {
        *cell = Some(k);
    }
    Ok(())
}

/// Derives the key and checks it against the stored verification blob.
/// Returns false on a wrong password (the store stays locked).
pub fn unlock(master: &str) -> Result<bool> {
    let conn = open()?;
    let salt = read_meta(&conn, "salt")?;
    let verification = read_meta(&conn, "verification")?;
    let k = derive_key(master, &salt);
    match decrypt(&k, &verification) {
        Ok(pt) if pt == VERIFY_PLAINTEXT => {
            if let Ok(mut cell) = key_cell().write() {
                *cell = Some(k);
            }
            Ok(true)
        }
        _ => Ok(false),
    }
}

/// Re-open the store with the process key (used after a restart). No-op when
/// already unlocked.
pub fn ensure_unlocked() -> Result<()> {
    if is_unlocked() {
        return Ok(());
    }
    anyhow::bail!("credential store is locked")
}

fn now() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)
}

// ---- CRUD ----

pub fn add(cred: &Credential) -> Result<()> {
    let k = key()?;
    let conn = open()?;
    let enc = encrypt(&k, cred.password.as_bytes())?;
    let created = if cred.created_at > 0 { cred.created_at } else { now() };
    conn.execute(
        "INSERT INTO credentials
            (id, profile_id, provider, email, password_enc, notes, created_at, last_used, keep_alive_minutes)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            cred.id,
            cred.profile_id,
            cred.provider,
            cred.email,
            enc,
            cred.notes,
            created,
            cred.last_used,
            cred.keep_alive_minutes,
        ],
    )?;
    Ok(())
}

pub fn update(cred: &Credential) -> Result<()> {
    let k = key()?;
    let conn = open()?;
    // An empty incoming password means "keep the stored one" — the UI never
    // receives the plaintext, so it cannot echo it back.
    let existing: Option<Vec<u8>> = conn
        .query_row(
            "SELECT password_enc FROM credentials WHERE id = ?1",
            params![cred.id],
            |r| r.get(0),
        )
        .ok();
    let enc = if cred.password.is_empty() {
        existing.ok_or_else(|| anyhow::anyhow!("credential not found"))?
    } else {
        encrypt(&k, cred.password.as_bytes())?
    };
    conn.execute(
        "UPDATE credentials
            SET profile_id = ?2, provider = ?3, email = ?4, password_enc = ?5,
                notes = ?6, keep_alive_minutes = ?7
          WHERE id = ?1",
        params![
            cred.id,
            cred.profile_id,
            cred.provider,
            cred.email,
            enc,
            cred.notes,
            cred.keep_alive_minutes,
        ],
    )?;
    Ok(())
}

pub fn remove(id: &str) -> Result<()> {
    let conn = open()?;
    conn.execute("DELETE FROM credentials WHERE id = ?1", params![id])?;
    Ok(())
}

fn row_to_credential(row: &rusqlite::Row<'_>, password: String) -> rusqlite::Result<Credential> {
    Ok(Credential {
        id: row.get(0)?,
        profile_id: row.get(1)?,
        provider: row.get(2)?,
        email: row.get(3)?,
        password,
        notes: row.get(5)?,
        created_at: row.get(6)?,
        last_used: row.get(7)?,
        keep_alive_minutes: row.get(8)?,
    })
}

/// List a profile's accounts, without decrypting the passwords.
pub fn list_for_profile(profile_id: &str) -> Result<Vec<Credential>> {
    let conn = open()?;
    let mut stmt = conn.prepare(
        "SELECT id, profile_id, provider, email, password_enc, notes, created_at, last_used, keep_alive_minutes
           FROM credentials WHERE profile_id = ?1 ORDER BY provider, email",
    )?;
    let rows = stmt.query_map(params![profile_id], |r| row_to_credential(r, String::new()))?;
    Ok(rows.collect::<rusqlite::Result<Vec<_>>>()?)
}

/// List all stored accounts across profiles, without decrypting the passwords.
pub fn list_all() -> Result<Vec<Credential>> {
    let conn = open()?;
    let mut stmt = conn.prepare(
        "SELECT id, profile_id, provider, email, password_enc, notes, created_at, last_used, keep_alive_minutes
           FROM credentials ORDER BY created_at DESC",
    )?;
    let rows = stmt.query_map([], |r| row_to_credential(r, String::new()))?;
    Ok(rows.collect::<rusqlite::Result<Vec<_>>>()?)
}

pub fn get(id: &str) -> Result<Credential> {
    ensure_unlocked()?;
    let k = key()?;
    let conn = open()?;
    let (cred, enc): (Credential, Vec<u8>) = conn.query_row(
        "SELECT id, profile_id, provider, email, password_enc, notes, created_at, last_used, keep_alive_minutes
           FROM credentials WHERE id = ?1",
        params![id],
        |r| {
            let enc: Vec<u8> = r.get(4)?;
            Ok((row_to_credential(r, String::new())?, enc))
        },
    )?;
    let password = String::from_utf8(decrypt(&k, &enc)?)?;
    Ok(Credential { password, ..cred })
}

pub fn touch(id: &str) -> Result<()> {
    let conn = open()?;
    conn.execute(
        "UPDATE credentials SET last_used = ?2 WHERE id = ?1",
        params![id, now()],
    )?;
    Ok(())
}

// ---- providers ----

pub fn providers() -> Vec<ProviderTemplate> {
    vec![
        ProviderTemplate {
            id: "gmail".into(),
            name: "Google / Gmail".into(),
            domains: vec![
                "accounts.google.com".into(),
                "mail.google.com".into(),
                "google.com".into(),
            ],
            keep_alive_url: "https://mail.google.com/mail/u/0/#inbox".into(),
        },
        ProviderTemplate {
            id: "x".into(),
            name: "X / Twitter".into(),
            domains: vec!["x.com".into(), "twitter.com".into()],
            keep_alive_url: "https://x.com/home".into(),
        },
        ProviderTemplate {
            id: "discord".into(),
            name: "Discord".into(),
            domains: vec!["discord.com".into(), "discordapp.com".into()],
            keep_alive_url: "https://discord.com/channels/@me".into(),
        },
        ProviderTemplate {
            id: "telegram".into(),
            name: "Telegram".into(),
            domains: vec!["web.telegram.org".into(), "telegram.org".into()],
            keep_alive_url: "https://web.telegram.org/a/".into(),
        },
        ProviderTemplate {
            id: "github".into(),
            name: "GitHub".into(),
            domains: vec!["github.com".into()],
            keep_alive_url: "https://github.com/".into(),
        },
        ProviderTemplate {
            id: "generic".into(),
            name: "Custom / Generic".into(),
            domains: vec![],
            keep_alive_url: "".into(),
        },
    ]
}

pub fn provider_by_id(id: &str) -> Option<ProviderTemplate> {
    providers().into_iter().find(|p| p.id == id)
}

/// Provider whose domain matches the URL.
pub fn detect_provider(url: &str) -> Option<String> {
    providers()
        .into_iter()
        .find(|p| p.domains.iter().any(|d| url.contains(d.as_str())))
        .map(|p| p.id)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn encrypt_roundtrip() {
        let k = [7u8; 32];
        let ct = encrypt(&k, b"hello").unwrap();
        assert_ne!(&ct[..NONCE_LEN], b"hello");
        assert_eq!(decrypt(&k, &ct).unwrap(), b"hello");
    }

    #[test]
    fn wrong_key_fails() {
        let ct = encrypt(&[1u8; 32], b"secret").unwrap();
        assert!(decrypt(&[2u8; 32], &ct).is_err());
    }

    #[test]
    fn detects_provider_by_domain() {
        assert_eq!(detect_provider("https://x.com/i/flow/login").as_deref(), Some("x"));
        assert_eq!(detect_provider("https://discord.com/login").as_deref(), Some("discord"));
        assert_eq!(detect_provider("https://github.com/login").as_deref(), Some("github"));
        assert!(detect_provider("https://example.com").is_none());
    }
}
