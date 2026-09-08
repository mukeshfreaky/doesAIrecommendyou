import { ScanReport } from "@/types";

// In-memory store for generated scan reports (persists during process lifetime)
const scanStore = new Map<string, ScanReport>();
const domainLastScanned = new Map<string, { timestamp: number; scanId: string }>();

const MAX_STORE_SIZE = 500;
const DOMAIN_COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes cooldown per domain

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
