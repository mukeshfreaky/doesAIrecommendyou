import { Citation, CitationCategory } from "@/types";

export function aggregateCitations(
  questionCitations: Citation[][],
  targetDomain: string,
  targetBrand: string
): Citation[] {
  const map = new Map<string, Citation>();
  const cleanTargetDomain = targetDomain.toLowerCase().replace(/^www\./, "");
  const cleanBrand = targetBrand.toLowerCase();

  for (const list of questionCitations) {
    for (const item of list) {
      const normUrl = item.url.replace(/\/$/, "").toLowerCase();
      const domain = item.domain.toLowerCase().replace(/^www\./, "");

      const supportsTargetBrand =
        domain.includes(cleanTargetDomain) ||
        (item.title ? item.title.toLowerCase().includes(cleanBrand) : false);

      const existing = map.get(normUrl);
      if (existing) {
        existing.frequency += 1;
        if (supportsTargetBrand) existing.supportsBrand = true;
      } else {
        map.set(normUrl, {
          url: item.url,
          domain: item.domain,
          title: item.title || item.domain,
          category: item.category || categorizeDomain(domain),
          supportsBrand: supportsTargetBrand,
          frequency: 1,
        });
      }
    }
  }

  const results = Array.from(map.values());
  // Sort by frequency descending, then supporting brand
  results.sort((a, b) => {
    if (b.frequency !== a.frequency) return b.frequency - a.frequency;
    return (b.supportsBrand ? 1 : 0) - (a.supportsBrand ? 1 : 0);
  });

  return results;
}

export function categorizeDomain(domain: string): CitationCategory {
  const d = domain.toLowerCase();
  if (
    d.includes("g2.com") ||
    d.includes("capterra.com") ||
    d.includes("trustradius.com") ||
    d.includes("getapp.com") ||
    d.includes("softwareadvice.com") ||
    d.includes("trustpilot.com")
  ) {
    return "REVIEW_SITE";
  }
  if (
    d.includes("reddit.com") ||
    d.includes("quora.com") ||
    d.includes("stackoverflow.com") ||
    d.includes("news.ycombinator.com")
  ) {
    return "COMMUNITY_FORUM";
  }
  if (
    d.includes("techcrunch.com") ||
    d.includes("forbes.com") ||
    d.includes("theverge.com") ||
    d.includes("wired.com") ||
    d.includes("bloomberg.com") ||
    d.includes("reuters.com")
  ) {
    return "NEWS";
  }
  if (
    d.includes("github.com") ||
    d.includes("docs.") ||
    d.includes("gitbook.io") ||
    d.includes("developer.")
  ) {
    return "DOCUMENTATION";
  }
  if (
    d.includes("slant.co") ||
    d.includes("alternativeto.net") ||
    d.includes("producthunt.com") ||
    d.includes("crunchbase.com") ||
    d.includes("wikipedia.org")
  ) {
    return "DIRECTORY";
  }
  if (
    d.includes("medium.com") ||
    d.includes("substack.com") ||
    d.includes("blog.")
  ) {
    return "EDITORIAL_COMPARISON";
  }
  return "OTHER";
}
