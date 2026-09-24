export type ValidationSeverity = "ok" | "warn" | "err";

export interface ValidationIssue {
  severity: ValidationSeverity;
  field: string;
  key: string;
  params?: Record<string, string | number>;
}

export function validateFingerprint(config: any): { score: number; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  let deductions = 0;

  const ua = (config?.navigator?.user_agent || "").toLowerCase();
  const platform = (config?.navigator?.platform || "").toLowerCase();
  const glVendor = (config?.webgl?.unmasked_vendor || "").toLowerCase();
  const glRenderer = (config?.webgl?.unmasked_renderer || "").toLowerCase();
  const cores = config?.navigator?.hardware_concurrency ?? 8;
  const memory = config?.navigator?.device_memory ?? 8;

  // 1. Platform vs UA mismatch
  if (platform.includes("win") && !ua.includes("windows")) {
    issues.push({ severity: "err", field: "platform", key: "fingerprint.osMismatchWin" });
    deductions += 30;
  }
  if (platform.includes("mac") && !ua.includes("macintosh")) {
    issues.push({ severity: "err", field: "platform", key: "fingerprint.osMismatchMac" });
    deductions += 30;
  }
  if (platform.includes("linux") && !ua.includes("linux")) {
    issues.push({ severity: "err", field: "platform", key: "fingerprint.osMismatchLinux" });
    deductions += 30;
  }

  // 2. GPU vs OS contradictions
  if (platform.includes("win") && (glRenderer.includes("apple") || glVendor.includes("apple"))) {
    issues.push({ severity: "err", field: "webgl", key: "fingerprint.appleGpuOnWin" });
    deductions += 40;
  }
  if (platform.includes("mac") && (glRenderer.includes("nvidia") || glRenderer.includes("geforce"))) {
    issues.push({ severity: "warn", field: "webgl", key: "fingerprint.nvidiaOnMac" });
    deductions += 15;
  }

  // 3. Hardware sanity
  if (cores < 2 || cores > 128) {
    issues.push({ severity: "warn", field: "cpu", key: "fingerprint.coresOdd", params: { n: cores } });
    deductions += 10;
  }
  if (memory < 2 || memory > 64) {
    issues.push({ severity: "warn", field: "ram", key: "fingerprint.ramOdd", params: { n: memory } });
    deductions += 10;
  }

  // 4. Screen resolution
  const width = config?.screen?.width ?? 0;
  const height = config?.screen?.height ?? 0;
  if (width > 0 && height > 0) {
    if (width < 320 || height < 480) {
      issues.push({ severity: "err", field: "screen", key: "fingerprint.screenSmall", params: { w: width, h: height } });
      deductions += 20;
    }
  }

  const score = Math.max(0, 100 - deductions);
  return { score, issues };
}
