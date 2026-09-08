import { CrawledPage } from "@/types";
import { safeFetchHtml } from "./fetcher";
import { parseHtml } from "./parser";

const MAX_PAGES = 5;

// Keywords used to score internal links for evidence priority
const PRIORITY_KEYWORDS = [
  "pricing",
  "price",
  "product",
  "products",
  "feature",
  "features",
  "solution",
  "solutions",
  "about",
  "services",
  "platform",
  "compare",
  "vs",
];

export function normalizeTargetUrl(inputUrl: string): string {
  let url = inputUrl.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  const parsed = new URL(url);
  // Normalize: lower-case hostname, remove fragment and query
  parsed.hash = "";
  parsed.search = "";
  let clean = parsed.toString();
  if (clean.endsWith("/") && parsed.pathname === "/") {
    clean = clean.slice(0, -1);
  }
  return clean;
}

/**
 * Crawls a website up to MAX_PAGES (default 5) starting from the homepage.
 */
export async function crawlWebsite(rawUrl: string): Promise<CrawledPage[]> {
  const normalizedRoot = normalizeTargetUrl(rawUrl);
  const crawledPages: CrawledPage[] = [];
  const visited = new Set<string>();

  // 1. Fetch Homepage
  const homeFetch = await safeFetchHtml(normalizedRoot);
  const homePage = parseHtml(homeFetch.finalUrl, homeFetch.html);
  crawledPages.push(homePage);
  visited.add(homeFetch.finalUrl.replace(/\/$/, ""));
  visited.add(normalizedRoot.replace(/\/$/, ""));

  // 2. Discover high-priority internal links
  const candidateLinks = scoreAndSortLinks(homePage.links);

  // 3. Fetch up to MAX_PAGES - 1 sub-pages
  for (const link of candidateLinks) {
    if (crawledPages.length >= MAX_PAGES) break;
    const cleanLink = link.replace(/\/$/, "");
    if (visited.has(cleanLink)) continue;
    visited.add(cleanLink);

    try {
      const fetchRes = await safeFetchHtml(link);
      const page = parseHtml(fetchRes.finalUrl, fetchRes.html);
      crawledPages.push(page);
    } catch {
      // Individual sub-page failures should not abort the whole scan
      continue;
    }
  }

  return crawledPages;
}

function scoreAndSortLinks(links: string[]): string[] {
  return [...links].sort((a, b) => {
    const scoreA = getLinkPriorityScore(a);
    const scoreB = getLinkPriorityScore(b);
    return scoreB - scoreA;
  });
}

function getLinkPriorityScore(urlStr: string): number {
  try {
    const pathname = new URL(urlStr).pathname.toLowerCase();
    let score = 0;
    for (const kw of PRIORITY_KEYWORDS) {
      if (pathname.includes(kw)) {
        score += 10;
        if (kw === "pricing" || kw === "product" || kw === "about") {
          score += 5;
        }
      }
    }
    // Penalize long deep nested paths
    const depth = pathname.split("/").filter(Boolean).length;
    score -= depth * 2;
    return score;
  } catch {
    return -100;
  }
}
