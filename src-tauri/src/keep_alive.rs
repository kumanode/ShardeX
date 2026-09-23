//! Session keep-alive: visits a provider's page on a timer so an idle session
//! is not dropped for inactivity. One task per profile; restart replaces it.

use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use anyhow::Result;

struct Active {
    handle: tokio::task::JoinHandle<()>,
}

#[derive(Default)]
pub struct KeepAlive {
    active: Arc<Mutex<HashMap<String, Active>>>,
}

impl KeepAlive {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn is_running(&self, profile_id: &str) -> bool {
        self.active
            .lock()
            .map(|a| a.contains_key(profile_id))
            .unwrap_or(false)
    }

    /// Start (or replace) the keep-alive task for a profile. `minutes` is the
    /// gap between visits; 0 stops it.
    pub fn start(&self, profile_id: &str, url: &str, minutes: u32) -> Result<()> {
        self.stop(profile_id);
        if minutes == 0 {
            return Ok(());
        }
        let profile = profile_id.to_string();
        let url = url.to_string();
        let handle = tokio::spawn(async move {
            let period = tokio::time::Duration::from_secs(minutes as u64 * 60);
            loop {
                tokio::time::sleep(period).await;
                match crate::cdp::navigate_page(&profile, &url).await {
                    Ok(()) => eprintln!("[keep-alive] refreshed {profile} via {url}"),
                    Err(e) => eprintln!("[keep-alive] {profile} skipped: {e}"),
                }
            }
        });
        if let Ok(mut a) = self.active.lock() {
            a.insert(profile_id.to_string(), Active { handle });
        }
        Ok(())
    }

    pub fn stop(&self, profile_id: &str) {
        if let Ok(mut a) = self.active.lock() {
            if let Some(entry) = a.remove(profile_id) {
                entry.handle.abort();
                eprintln!("[keep-alive] stopped for {profile_id}");
            }
        }
    }
}
