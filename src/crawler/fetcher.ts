import { validateUrlForSSRF } from "./ssrfValidator";

export interface FetchResult {
  url: string;
  finalUrl: string;
  status: number;
  html: string;
  durationMs: number;
}

const MAX_BODY_BYTES = 1_500_000; // 1.5MB cap
const TIMEOUT_MS = 5_000; // 5 seconds
const MAX_REDIRECTS = 3;
const USER_AGENT = "DoesAIRecommendYouBot/1.0 (+https://doesairecommendyou.com/bot; research@doesairecommendyou.com)";

/**
 * Safely fetches an HTML page with strict SSRF protection, timeout, and size limits.
 */
export async function safeFetchHtml(rawUrl: string): Promise<FetchResult> {
  const startTime = Date.now();
  let currentUrl = rawUrl;
  let redirectsRemaining = MAX_REDIRECTS;

  while (redirectsRemaining >= 0) {
    // 1. SSRF check before every request (including redirects)
    const ssrfCheck = await validateUrlForSSRF(currentUrl);
    if (!ssrfCheck.safe) {
      throw new Error(`SSRF Blocked (${currentUrl}): ${ssrfCheck.reason}`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(currentUrl, {
        method: "GET",
        signal: controller.signal,
        redirect: "manual", // Handle redirects manually to re-run SSRF validation
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
      });

      clearTimeout(timeoutId);

      // 2. Handle HTTP Redirects manually
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) {
          throw new Error(`Redirect response from ${currentUrl} missing Location header`);
        }
        const nextUrl = new URL(location, currentUrl).href;
        currentUrl = nextUrl;
        redirectsRemaining--;
        if (redirectsRemaining < 0) {
          throw new Error(`Too many redirects (exceeded limit of ${MAX_REDIRECTS})`);
        }
        continue;
      }

      // 3. Verify status code
      if (!response.ok) {
        throw new Error(`HTTP fetch failed with status ${response.status} for ${currentUrl}`);
      }

      // 4. Verify Content-Type is HTML/text
      const contentType = response.headers.get("content-type") || "";
      if (
        !contentType.includes("text/html") &&
        !contentType.includes("application/xhtml") &&
        !contentType.includes("text/plain")
      ) {
        throw new Error(`Unsupported Content-Type (${contentType}). Only HTML/text is allowed.`);
      }

      // 5. Read response with strict size limit
      const reader = response.body?.getReader();
      if (!reader) {
        const text = await response.text();
        return {
          url: rawUrl,
          finalUrl: currentUrl,
          status: response.status,
          html: text.slice(0, MAX_BODY_BYTES),
          durationMs: Date.now() - startTime,
        };
      }

      let receivedBytes = 0;
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          receivedBytes += value.length;
          if (receivedBytes > MAX_BODY_BYTES) {
            // Truncate stream safely without crashing
            chunks.push(value.subarray(0, MAX_BODY_BYTES - (receivedBytes - value.length)));
            reader.cancel();
            break;
          }
          chunks.push(value);
        }
      }

      const totalBuffer = new Uint8Array(Math.min(receivedBytes, MAX_BODY_BYTES));
      let offset = 0;
      for (const chunk of chunks) {
        totalBuffer.set(chunk, offset);
        offset += chunk.length;
      }

      const html = new TextDecoder("utf-8").decode(totalBuffer);

      return {
        url: rawUrl,
        finalUrl: currentUrl,
        status: response.status,
        html,
        durationMs: Date.now() - startTime,
      };
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(`Connection timed out after ${TIMEOUT_MS}ms for ${currentUrl}`);
      }
      throw err;
    }
  }

  throw new Error(`Exceeded maximum redirect limit for ${rawUrl}`);
}
