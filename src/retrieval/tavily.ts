import { WebEvidence, WebRetriever, RetrievalOptions, RetrievalResult } from "./types";

/**
 * Normalizes a URL for deduplication by lowercasing, stripping standard tracking
 * parameters and trailing slashes.
 */
export function normalizeEvidenceUrl(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    // Reject localhost / private IP addresses
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      !hostname.includes(".")
    ) {
      return null;
    }
    parsed.hostname = hostname;

    // Strip trailing slash from pathname
    if (parsed.pathname.endsWith("/") && parsed.pathname.length > 1) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }

    // Strip common tracking params
    const cleanParams = new URLSearchParams();
    for (const [key, value] of parsed.searchParams.entries()) {
      if (!key.startsWith("utm_") && key !== "ref" && key !== "source" && key !== "fbclid" && key !== "gclid") {
        cleanParams.append(key, value);
      }
    }
    parsed.search = cleanParams.toString() ? `?${cleanParams.toString()}` : "";
    parsed.hash = "";

    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Normalizes raw search items into clean, validated WebEvidence objects.
 * Enforces:
 * - Valid HTTP/HTTPS URLs
 * - Valid hostnames
 * - Exact URL deduplication
 * - Max 2 items per domain for source diversity
 * - Discarding empty/malformed titles and snippets
 * - Deterministic sequential ID assignment (EVIDENCE_1 ... EVIDENCE_N)
 */
export function filterAndNormalizeEvidence(
  rawResults: any[],
  maxResults = 5,
  retrievedAt = new Date().toISOString()
): WebEvidence[] {
  if (!Array.isArray(rawResults)) return [];

  const seenUrls = new Set<string>();
  const domainCounts = new Map<string, number>();
  const validEvidence: WebEvidence[] = [];

  for (const item of rawResults) {
    if (!item || typeof item !== "object") continue;

    const rawUrl = typeof item.url === "string" ? item.url.trim() : "";
    if (!rawUrl) continue;

    const normalizedUrl = normalizeEvidenceUrl(rawUrl);
    if (!normalizedUrl || seenUrls.has(normalizedUrl)) continue;

    let domain = "";
    try {
      domain = new URL(normalizedUrl).hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      continue;
    }

    if (!domain || domain.length < 3) continue;

    // Enforce max 2 results per domain for diversity
    const currentDomainCount = domainCounts.get(domain) || 0;
    if (currentDomainCount >= 2) continue;

    const title = typeof item.title === "string" ? item.title.trim() : "";
    const snippet = typeof item.content === "string"
      ? item.content.trim()
      : typeof item.raw_content === "string"
      ? item.raw_content.trim()
      : "";

    // Require substantive snippet and title
    if (!title || title.length < 2 || !snippet || snippet.length < 15) continue;

    seenUrls.add(normalizedUrl);
    domainCounts.set(domain, currentDomainCount + 1);

    validEvidence.push({
      id: `EVIDENCE_${validEvidence.length + 1}`,
      title,
      url: rawUrl,
      domain,
      snippet,
      retrievedAt,
    });

    if (validEvidence.length >= maxResults) break;
  }

  return validEvidence;
}

export class TavilyRetriever implements WebRetriever {
  readonly id = "tavily";
  readonly name = "Tavily Search API";

  isConfigured(): boolean {
    const key = process.env.TAVILY_API_KEY;
    return typeof key === "string" && key.trim().length > 0;
  }

  async retrieve(query: string, options?: RetrievalOptions): Promise<RetrievalResult> {
    const startTime = Date.now();
    const apiKey = process.env.TAVILY_API_KEY?.trim();

    if (!apiKey) {
      return {
        success: false,
        evidence: [],
        query,
        error: "TAVILY_API_KEY is not configured on the server",
        latencyMs: 0,
        costUSD: 0,
      };
    }

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return {
        success: false,
        evidence: [],
        query: query || "",
        error: "Search query must be a non-empty string",
        latencyMs: 0,
        costUSD: 0,
      };
    }

    const maxResults = Math.min(Math.max(options?.maxResults || 5, 1), 5);
    const timeoutMs = options?.timeoutMs || 10000;
    const searchDepth = options?.searchDepth || "basic";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: apiKey,
          query: query.trim(),
          search_depth: searchDepth,
          include_answer: false,
          max_results: maxResults * 2, // fetch slightly more to allow quality filtering
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        return {
          success: false,
          evidence: [],
          query,
          error: `Tavily API returned HTTP ${response.status}: ${errorText || response.statusText}`,
          latencyMs,
          costUSD: 0,
        };
      }

      const data = await response.json().catch(() => null);
      if (!data || !Array.isArray(data.results)) {
        return {
          success: false,
          evidence: [],
          query,
          error: "Tavily API returned malformed or non-array JSON results",
          latencyMs,
          costUSD: 0,
        };
      }

      const evidence = filterAndNormalizeEvidence(data.results, maxResults);

      if (evidence.length === 0) {
        return {
          success: false,
          evidence: [],
          query,
          error: "Zero usable web evidence returned after quality filtering",
          latencyMs,
          costUSD: 0,
        };
      }

      return {
        success: true,
        evidence,
        query,
        latencyMs,
        costUSD: 0, // Free tier credits
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;
      const isTimeout = err.name === "AbortError" || err.message?.includes("aborted");
      return {
        success: false,
        evidence: [],
        query,
        error: isTimeout
          ? `Tavily retrieval timed out after ${timeoutMs}ms`
          : `Tavily network/execution error: ${err.message || String(err)}`,
        latencyMs,
        costUSD: 0,
      };
    }
  }
}