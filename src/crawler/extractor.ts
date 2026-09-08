import { BusinessProfile, CrawledPage } from "@/types";

const KNOWN_INDUSTRIES = [
  "fintech",
  "finance",
  "banking",
  "healthcare",
  "medical",
  "biotech",
  "e-commerce",
  "ecommerce",
  "retail",
  "education",
  "edtech",
  "cybersecurity",
  "security",
  "devops",
  "developer tools",
  "marketing",
  "sales",
  "human resources",
  "hr",
  "recruiting",
  "real estate",
  "logistics",
  "supply chain",
  "legal",
  "hospitality",
  "manufacturing",
  "b2b saas",
  "saas",
];

const TARGET_CUSTOMER_PATTERNS = [
  /(?:built for|designed for|trusted by|tailored for|for)\s+([a-z0-9\s\-]+?)(?:\.|\n|,|\band\b)/i,
  /(?:helping|empowering)\s+([a-z0-9\s\-]+?)(?:\s+to|\.|\n|,)/i,
  /(?:teams|businesses|enterprises|startups|developers|marketers|founders|agencies|creators|designers)/i,
];

const PRICING_PATTERNS = [
  /(?:[\$\u00A3\u20AC])\s*\d+(?:\.\d{2})?(?:\s*\/\s*(?:mo|month|yr|year|user|seat))?/i,
  /(?:free tier|free plan|starts? at|starting at|per user|per seat|contact sales|custom pricing|free trial)/i,
  /(?:billed annually|billed monthly)/i,
];

/**
 * Extracts a structured BusinessProfile from crawled pages.
 * Adheres strictly to the principle: NEVER hallucinate missing fields.
 */
export function extractBusinessProfile(
  pages: CrawledPage[],
  rootUrl: string
): BusinessProfile {
  if (!pages || pages.length === 0) {
    throw new Error("Cannot extract business profile from empty pages list");
  }

  const homepage = pages[0];
  const domain = extractDomain(rootUrl || homepage.url);
  const name = extractBrandName(homepage, domain);
  const description = extractDescription(pages);
  const productsOrServices = extractProducts(pages);
  const targetCustomers = extractTargetCustomers(pages);
  const industries = extractIndustries(pages);
  const pricingSignals = extractPricingSignals(pages);
  const keyFeatures = extractKeyFeatures(pages);
  const useCases = extractUseCases(pages);
  const locations = extractLocations(pages);
  const differentiators = extractDifferentiators(pages);
  const sourcePages = pages.map((p) => p.url);

  return {
    name,
    domain,
    description,
    productsOrServices,
    targetCustomers,
    industries,
    pricingSignals,
    keyFeatures,
    useCases,
    locations,
    differentiators,
    sourcePages,
  };
}

function extractDomain(urlStr: string): string {
  try {
    const parsed = new URL(urlStr.startsWith("http") ? urlStr : `https://${urlStr}`);
    return parsed.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return urlStr.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase();
  }
}

function extractBrandName(homepage: CrawledPage, domain: string): string {
  // 1. Try Title before separators (e.g. "Acme: The AI Agent Platform" -> "Acme")
  if (homepage.title) {
    const parts = homepage.title.split(/[|:??-]/);
    const candidate = parts[0].trim();
    // Verify candidate is reasonable brand name length and not a generic statement
    if (candidate.length > 1 && candidate.length < 40 && !candidate.toLowerCase().startsWith("home")) {
      return candidate;
    }
  }

  // 2. Try first H1
  for (const h of homepage.headings) {
    const trimmed = h.trim();
    if (trimmed.length > 1 && trimmed.length < 35 && !trimmed.toLowerCase().includes("welcome")) {
      return trimmed;
    }
  }

  // 3. Fallback to capitalized domain root
  const baseDomain = domain.split(".")[0];
  return baseDomain.charAt(0).toUpperCase() + baseDomain.slice(1);
}

function extractDescription(pages: CrawledPage[]): string {
  // 1. Check meta descriptions
  for (const page of pages) {
    if (page.description && page.description.trim().length > 20) {
      return page.description.trim();
    }
  }

  // 2. Fallback to first substantive text paragraph from homepage
  if (pages[0]?.text) {
    const paragraphs = pages[0].text
      .split(/\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 40 && p.length < 300);
    if (paragraphs.length > 0) {
      return paragraphs[0];
    }
  }

  return "No description detected on crawled pages.";
}

function extractProducts(pages: CrawledPage[]): string[] {
  const products = new Set<string>();

  for (const page of pages) {
    const isProductPage = /product|service|solution|feature/i.test(page.url);
    if (isProductPage && page.title) {
      const cleanTitle = page.title.split(/[|:??-]/)[0].trim();
      if (cleanTitle.length > 2 && cleanTitle.length < 50) {
        products.add(cleanTitle);
      }
    }

    // Check headings
    for (const h of page.headings) {
      if (/platform|engine|suite|analytics|api|sdk|assistant|copilot|manager/i.test(h)) {
        if (h.length < 60) {
          products.add(h.trim());
        }
      }
    }
  }

  return Array.from(products).slice(0, 8);
}

function extractTargetCustomers(pages: CrawledPage[]): string[] {
  const targets = new Set<string>();

  for (const page of pages) {
    const text = `${page.description} ${page.headings.join(" ")} ${page.text}`;
    for (const pattern of TARGET_CUSTOMER_PATTERNS) {
      const matches = text.matchAll(new RegExp(pattern, "gi"));
      for (const m of matches) {
        if (m[1]) {
          const clean = m[1].trim();
          if (clean.length > 2 && clean.length < 40 && !clean.toLowerCase().includes("http")) {
            targets.add(clean);
          }
        } else if (m[0]) {
          targets.add(m[0].trim());
        }
      }
    }
  }

  return Array.from(targets).slice(0, 6);
}

function extractIndustries(pages: CrawledPage[]): string[] {
  const matched = new Set<string>();
  const combinedText = pages.map((p) => `${p.title} ${p.description} ${p.text}`).join(" ").toLowerCase();

  for (const ind of KNOWN_INDUSTRIES) {
    // Word boundary check
    const regex = new RegExp(`\\b${ind}\\b`, "i");
    if (regex.test(combinedText)) {
      matched.add(ind);
    }
  }

  return Array.from(matched).slice(0, 5);
}

function extractPricingSignals(pages: CrawledPage[]): string[] {
  const signals = new Set<string>();

  for (const page of pages) {
    const isPricingPage = /pric/i.test(page.url);
    const text = isPricingPage ? page.text : `${page.description} ${page.text.slice(0, 2000)}`;

    for (const pattern of PRICING_PATTERNS) {
      const matches = text.matchAll(new RegExp(pattern, "gi"));
      for (const m of matches) {
        const matchStr = m[0].trim();
        if (matchStr.length > 0 && matchStr.length < 60) {
          signals.add(matchStr);
        }
      }
    }
  }

  return Array.from(signals).slice(0, 6);
}

function extractKeyFeatures(pages: CrawledPage[]): string[] {
  const features = new Set<string>();

  for (const page of pages) {
    for (const h of page.headings) {
      const clean = h.trim();
      if (
        clean.length > 5 &&
        clean.length < 70 &&
        !/about|contact|privacy|terms|cookie|pricing|blog|login|sign up/i.test(clean)
      ) {
        features.add(clean);
      }
    }
  }

  return Array.from(features).slice(0, 10);
}

function extractUseCases(pages: CrawledPage[]): string[] {
  const useCases = new Set<string>();

  for (const page of pages) {
    for (const h of page.headings) {
      if (/for\s+[a-z]+/i.test(h) || /use case/i.test(page.url)) {
        const clean = h.trim();
        if (clean.length > 5 && clean.length < 80) {
          useCases.add(clean);
        }
      }
    }
  }

  return Array.from(useCases).slice(0, 6);
}

function extractLocations(pages: CrawledPage[]): string[] {
  const locations = new Set<string>();
  const locationRegex = /(?:headquarters|offices?|based in|located in)\s+([A-Z][a-zA-Z\s,]+?)(?:\.|\n|<)/g;

  for (const page of pages) {
    const matches = page.text.matchAll(locationRegex);
    for (const m of matches) {
      if (m[1]) {
        const loc = m[1].trim();
        if (loc.length > 2 && loc.length < 50) {
          locations.add(loc);
        }
      }
    }
  }

  return Array.from(locations).slice(0, 4);
}

function extractDifferentiators(pages: CrawledPage[]): string[] {
  const diffs = new Set<string>();
  const diffRegex = /(?:the only|first|fastest|most accurate|unlike other|why choose|leading)\s+([^.\n]{10,120})/gi;

  for (const page of pages) {
    const matches = page.text.matchAll(diffRegex);
    for (const m of matches) {
      if (m[0]) {
        const d = m[0].trim();
        if (d.length > 10 && d.length < 100) {
          diffs.add(d);
        }
      }
    }
  }

  return Array.from(diffs).slice(0, 5);
}
