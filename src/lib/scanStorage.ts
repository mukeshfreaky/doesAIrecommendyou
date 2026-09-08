import { ScanReport } from "@/types";

// In-memory store for generated scan reports (persists during process lifetime)
// ARCHITECTURAL NOTE: This in-memory store is MVP-only and scoped to the running Node.js process.
// It is not durable across serverless container restarts or distributed multi-region instances.
// In a future multi-instance production environment, this should be backed by Redis / KV / Postgres.
const scanStore = new Map<string, ScanReport>();
const domainLastScanned = new Map<string, { timestamp: number; scanId: string }>();

const MAX_STORE_SIZE = 500;

// Public-tier domain cooldown: 12 hours (12 * 60 * 60 * 1000 ms)
// Prevents duplicate queries from consuming provider search grounding quota on the same domain within half a day.
export const DOMAIN_COOLDOWN_MS = 12 * 60 * 60 * 1000;

export function saveScanReport(report: ScanReport): void {
  if (scanStore.size >= MAX_STORE_SIZE) {
    const oldestKey = scanStore.keys().next().value;
    if (oldestKey) scanStore.delete(oldestKey);
  }
  scanStore.set(report.scanId, report);
  domainLastScanned.set(report.domain.toLowerCase(), {
    timestamp: Date.now(),
    scanId: report.scanId,
  });
}

export function getScanReport(scanId: string): ScanReport | undefined {
  return scanStore.get(scanId);
}

export function getRecentScanForDomain(domain: string): { report: ScanReport; ageMs: number } | null {
  const normDomain = domain.toLowerCase().replace(/^www\./, "");
  const entry = domainLastScanned.get(normDomain);
  if (!entry) return null;

  const ageMs = Date.now() - entry.timestamp;
  if (ageMs < DOMAIN_COOLDOWN_MS) {
    const report = scanStore.get(entry.scanId);
    if (report) {
      return { report, ageMs };
    }
  }
  return null;
}

/**
 * Resets storage (used in test suites).
 */
export function resetScanStorage(): void {
  scanStore.clear();
  domainLastScanned.clear();
}
