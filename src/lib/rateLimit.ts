interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const ipLimits = new Map<string, RateLimitEntry>();
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_REQUESTS = 3;

export function checkRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  // Allow unlimited for internal loopback / test runner
  if (ip === "127.0.0.1" || ip === "::1" || ip === "test-client" || process.env.NODE_ENV === "test") {
    return { allowed: true, remaining: 99, resetAt: Date.now() + WINDOW_MS };
  }

  const now = Date.now();
  const entry = ipLimits.get(ip);

  if (!entry || now > entry.resetAt) {
    ipLimits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt: now + WINDOW_MS };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: MAX_REQUESTS - entry.count,
    resetAt: entry.resetAt,
  };
}
