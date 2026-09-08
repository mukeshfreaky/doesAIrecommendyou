import net from "net";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const ipLimits = new Map<string, RateLimitEntry>();
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
export const MAX_SCAN_LIMIT = 3;

function isValidIp(ip: string): boolean {
  return net.isIP(ip) !== 0;
}

/**
 * Trusted Client IP Extraction Model
 *
 * Problem:
 * Naively taking the first IP from `x-forwarded-for` allows malicious callers to spoof arbitrary IPs
 * (e.g. `X-Forwarded-For: 1.2.3.4, 5.6.7.8`), rotating fake IPs to bypass per-IP rate limits.
 *
 * Solution & Trust Hierarchy:
 * 1. Cloudflare Edge: If deployed behind Cloudflare, `cf-connecting-ip` is stripped and overwritten
 *    at Cloudflare edge with the true client socket IP, making client-side spoofing impossible.
 * 2. Standard Gateway: `x-real-ip` set by trusted edge proxy.
 * 3. Rightmost entry in `x-forwarded-for`: When behind an edge reverse-proxy, the proxy appends
 *    the connecting client IP at the END of the header chain. The leftmost entry is client-controlled
 *    and untrusted.
 * 4. Fallback: Loopback address for local development.
 */
export function extractClientIp(headers: Headers): string {
  // 1. Cloudflare Connecting IP (primary trusted header for Cloudflare edge deployments)
  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp && isValidIp(cfConnectingIp.trim())) {
    return cfConnectingIp.trim();
  }

  // 2. Verified real IP set by trusted proxy
  const realIp = headers.get("x-real-ip");
  if (realIp && isValidIp(realIp.trim())) {
    return realIp.trim();
  }

  // 3. Rightmost entry in x-forwarded-for (appended by immediate upstream edge gateway)
  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const parts = xForwardedFor.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) {
      const edgeAppendedIp = parts[parts.length - 1];
      if (isValidIp(edgeAppendedIp)) {
        return edgeAppendedIp;
      }
    }
  }

  return "127.0.0.1";
}

/**
 * Checks rate limits (3 scans per 24 hours per client IP).
 */
export function checkRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const entry = ipLimits.get(ip);

  if (!entry || now > entry.resetAt) {
    ipLimits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_SCAN_LIMIT - 1, resetAt: now + WINDOW_MS };
  }

  if (entry.count >= MAX_SCAN_LIMIT) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: MAX_SCAN_LIMIT - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Resets rate limit entries (used primarily in test suites).
 */
export function resetRateLimits(): void {
  ipLimits.clear();
}
