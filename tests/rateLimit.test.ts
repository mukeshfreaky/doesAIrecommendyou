import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, extractClientIp, resetRateLimits, MAX_SCAN_LIMIT } from "../src/lib/rateLimit";

describe("Rate Limiter & Trusted Client IP Extraction", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it("prioritizes Cloudflare cf-connecting-ip over spoofed x-forwarded-for", () => {
    const headers = new Headers();
    headers.set("x-forwarded-for", "1.1.1.1, 2.2.2.2, 3.3.3.3"); // Spoofed chain
    headers.set("cf-connecting-ip", "198.51.100.42"); // Trusted Cloudflare IP

    const extracted = extractClientIp(headers);
    expect(extracted).toBe("198.51.100.42");
  });

  it("uses rightmost edge-appended IP from x-forwarded-for when cf-connecting-ip is absent", () => {
    const headers = new Headers();
    // Attacker forged "10.0.0.1, 192.168.1.1", edge reverse proxy appended real connecting IP "198.51.100.88"
    headers.set("x-forwarded-for", "10.0.0.1, 192.168.1.1, 198.51.100.88");

    const extracted = extractClientIp(headers);
    expect(extracted).toBe("198.51.100.88");
  });

  it("prevents rate limit bypass via spoofed x-forwarded-for headers when behind Cloudflare", () => {
    const realClientIp = "198.51.100.55";

    // Attempt 1: Attacker sends spoofed header 10.0.0.1
    const headers1 = new Headers({
      "cf-connecting-ip": realClientIp,
      "x-forwarded-for": "10.0.0.1",
    });
    const ip1 = extractClientIp(headers1);
    const res1 = checkRateLimit(ip1);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(2);

    // Attempt 2: Attacker rotates spoofed header to 10.0.0.2
    const headers2 = new Headers({
      "cf-connecting-ip": realClientIp,
      "x-forwarded-for": "10.0.0.2",
    });
    const ip2 = extractClientIp(headers2);
    const res2 = checkRateLimit(ip2);
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(1);

    // Attempt 3: Attacker rotates spoofed header to 10.0.0.3
    const headers3 = new Headers({
      "cf-connecting-ip": realClientIp,
      "x-forwarded-for": "10.0.0.3",
    });
    const ip3 = extractClientIp(headers3);
    const res3 = checkRateLimit(ip3);
    expect(res3.allowed).toBe(true);
    expect(res3.remaining).toBe(0);

    // Attempt 4: Should be BLOCKED despite rotating x-forwarded-for
    const headers4 = new Headers({
      "cf-connecting-ip": realClientIp,
      "x-forwarded-for": "10.0.0.4",
    });
    const ip4 = extractClientIp(headers4);
    const res4 = checkRateLimit(ip4);
    expect(res4.allowed).toBe(false);
    expect(res4.remaining).toBe(0);
  });

  it("enforces strict maximum limit of 3 scans per 24 hours per IP", () => {
    const testIp = "203.0.113.99";

    expect(checkRateLimit(testIp).allowed).toBe(true); // scan 1
    expect(checkRateLimit(testIp).allowed).toBe(true); // scan 2
    expect(checkRateLimit(testIp).allowed).toBe(true); // scan 3
    expect(checkRateLimit(testIp).allowed).toBe(false); // scan 4 blocked
  });
});
