import { describe, it, expect } from "vitest";
import { isIpPrivateOrReserved, validateTargetUrl } from "../src/crawler/ssrfValidator";

describe("SSRF Protection & Network Validation", () => {
  it("blocks IPv4 loopback addresses", () => {
    expect(isIpPrivateOrReserved("127.0.0.1")).toBe(true);
    expect(isIpPrivateOrReserved("127.0.1.5")).toBe(true);
  });

  it("blocks RFC 1918 private IPv4 ranges", () => {
    expect(isIpPrivateOrReserved("10.0.0.1")).toBe(true);
    expect(isIpPrivateOrReserved("10.254.1.1")).toBe(true);
    expect(isIpPrivateOrReserved("172.16.0.1")).toBe(true);
    expect(isIpPrivateOrReserved("172.31.255.255")).toBe(true);
    expect(isIpPrivateOrReserved("192.168.1.1")).toBe(true);
    expect(isIpPrivateOrReserved("192.168.100.50")).toBe(true);
  });

  it("blocks Cloud Metadata IP (169.254.169.254)", () => {
    expect(isIpPrivateOrReserved("169.254.169.254")).toBe(true);
    expect(isIpPrivateOrReserved("169.254.1.1")).toBe(true);
  });

  it("blocks IPv6 loopback and link-local", () => {
    expect(isIpPrivateOrReserved("::1")).toBe(true);
    expect(isIpPrivateOrReserved("fe80::1")).toBe(true);
  });

  it("allows standard public routable IPs", () => {
    expect(isIpPrivateOrReserved("8.8.8.8")).toBe(false);
    expect(isIpPrivateOrReserved("1.1.1.1")).toBe(false);
    expect(isIpPrivateOrReserved("142.250.190.46")).toBe(false);
  });

  it("validates full URLs and rejects localhost or internal domains", async () => {
    const localhostRes = await validateTargetUrl("http://localhost:3000");
    expect(localhostRes.isValid).toBe(false);

    const ipLoopbackRes = await validateTargetUrl("http://127.0.0.1/admin");
    expect(ipLoopbackRes.isValid).toBe(false);

    const cloudMetaRes = await validateTargetUrl("http://169.254.169.254/latest/meta-data");
    expect(cloudMetaRes.isValid).toBe(false);
  });

  it("rejects non-http/https protocols", async () => {
    const fileRes = await validateTargetUrl("file:///etc/passwd");
    expect(fileRes.isValid).toBe(false);

    const ftpRes = await validateTargetUrl("ftp://ftp.example.com");
    expect(ftpRes.isValid).toBe(false);
  });

  it("blocks redirect SSRF targets resolving to internal/metadata IPs", async () => {
    const redirectTarget1 = "http://127.0.0.1:8080/internal";
    const redirectTarget2 = "http://169.254.169.254/computeMetadata/v1/";
    const redirectTarget3 = "http://10.0.0.5/api";
    const redirectTarget4 = "http://[::1]/admin";

    expect((await validateTargetUrl(redirectTarget1)).isValid).toBe(false);
    expect((await validateTargetUrl(redirectTarget2)).isValid).toBe(false);
    expect((await validateTargetUrl(redirectTarget3)).isValid).toBe(false);
    expect((await validateTargetUrl(redirectTarget4)).isValid).toBe(false);
  });
});
