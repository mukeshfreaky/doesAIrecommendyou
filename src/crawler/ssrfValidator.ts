import dns from "dns/promises";
import net from "net";

export interface SSRFValidationResult {
  safe: boolean;
  resolvedIp?: string;
  reason?: string;
}

/**
 * Checks whether an IPv4 string is in a private, loopback, link-local, or cloud metadata range.
 */
export function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformed is treated as unsafe
  }

  const [a, b] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;

  // 127.0.0.0/8 (Loopback / Localhost)
  if (a === 127) return true;

  // 10.0.0.0/8 (Private RFC 1918)
  if (a === 10) return true;

  // 172.16.0.0/12 (Private RFC 1918: 172.16.0.0 - 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.168.0.0/16 (Private RFC 1918)
  if (a === 192 && b === 168) return true;

  // 169.254.0.0/16 (Link-local & AWS/GCP/Azure Cloud Metadata 169.254.169.254)
  if (a === 169 && b === 254) return true;

  // 100.64.0.0/10 (Carrier-grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true;

  // 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24 (Documentation / Test-Net)
  if (a === 192 && b === 0 && parts[2] === 2) return true;
  if (a === 198 && b === 51 && parts[2] === 100) return true;
  if (a === 203 && b === 0 && parts[2] === 113) return true;

  // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
  if (a >= 224) return true;

  return false;
}

/**
 * Checks whether an IPv6 string is private, loopback, or link-local.
 */
export function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  // Loopback ::1
  if (normalized === "::1" || normalized === "0:0:0:0:0:0:0:1") return true;

  // Unspecified ::
  if (normalized === "::" || normalized === "0:0:0:0:0:0:0:0") return true;

  // Unique Local Address (ULA) fc00::/7 (fc00:: to fdff::)
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;

  // Link-Local Unicast fe80::/10
  if (
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  ) {
    return true;
  }

  // IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1)
  if (normalized.includes("::ffff:")) {
    const ipv4Part = normalized.split("::ffff:")[1];
    if (ipv4Part && net.isIPv4(ipv4Part)) {
      return isPrivateIPv4(ipv4Part);
    }
  }

  return false;
}

/**
 * Validates a URL and its resolved IP to strictly prohibit SSRF attacks.
 */
export async function validateUrlForSSRF(rawUrl: string): Promise<SSRFValidationResult> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { safe: false, reason: "Malformed URL syntax" };
  }

  // Protocol check: Only http: and https: allowed
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { safe: false, reason: `Unsupported protocol: ${parsed.protocol}. Only http: and https: are allowed.` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Reject empty, localhost or obvious local domain suffixes
  if (
    !hostname ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname === "metadata.google.internal"
  ) {
    return { safe: false, reason: "Localhost or internal domain prohibited" };
  }

  // If the hostname is already an IP address, validate it directly
  if (net.isIPv4(hostname)) {
    if (isPrivateIPv4(hostname)) {
      return { safe: false, resolvedIp: hostname, reason: "Private or reserved IPv4 address blocked" };
    }
    return { safe: true, resolvedIp: hostname };
  }

  if (net.isIPv6(hostname)) {
    if (isPrivateIPv6(hostname)) {
      return { safe: false, resolvedIp: hostname, reason: "Private or reserved IPv6 address blocked" };
    }
    return { safe: true, resolvedIp: hostname };
  }

  // Resolve hostname via DNS
  try {
    const lookup = await dns.lookup(hostname, { all: true });
    if (!lookup || lookup.length === 0) {
      return { safe: false, reason: "DNS resolution yielded no IP addresses" };
    }

    for (const record of lookup) {
      if (record.family === 4 && isPrivateIPv4(record.address)) {
        return {
          safe: false,
          resolvedIp: record.address,
          reason: `Domain resolved to private IPv4 address (${record.address})`,
        };
      }
      if (record.family === 6 && isPrivateIPv6(record.address)) {
        return {
          safe: false,
          resolvedIp: record.address,
          reason: `Domain resolved to private IPv6 address (${record.address})`,
        };
      }
    }

    return { safe: true, resolvedIp: lookup[0].address };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { safe: false, reason: `DNS lookup failed: ${message}` };
  }
}

export function isIpPrivateOrReserved(ip: string): boolean {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);
  if (net.isIPv6(ip)) return isPrivateIPv6(ip);
  return isPrivateIPv4(ip);
}

export async function validateTargetUrl(rawUrl: string): Promise<{ isValid: boolean; reason?: string }> {
  const res = await validateUrlForSSRF(rawUrl);
  return { isValid: res.safe, reason: res.reason };
}
