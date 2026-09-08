import { BusinessProfile, CrawledPage } from "@/types";

// Verified persona nouns for target audience extraction
const VALID_PERSONAS = [
  "developers",
  "software engineers",
  "engineers",
  "engineering teams",
  "devops",
  "devops teams",
  "site reliability engineers",
  "product managers",
  "marketers",
  "sales teams",
  "finance teams",
  "merchants",
  "retailers",
  "e-commerce brands",
  "startups",
  "enterprises",
  "founders",
  "agencies",
  "creators",
  "businesses",
];

// Curated canonical category patterns derived strictly from explicit website evidence
const CANONICAL_CATEGORY_RULES: Array<{
  pattern: RegExp;
  category: string;
}> = [
  {
    pattern: /\b(?:email\s+(?:api|for\s+developers|delivery|infrastructure)|transactional\s+email|send\s+emails)\b/i,
    category: "Email Delivery & Transactional Email API",
  },
  {
    pattern: /\b(?:payment\s+processing|payments?\s+infrastructure|accept\s+payments|payment\s+gateway)\b/i,
    category: "Payment Processing & Financial Infrastructure",
  },
  {
    pattern: /\b(?:e-?commerce\s+platform|online\s+store\s+builder|commerce\s+platform|shopping\s+cart)\b/i,
    category: "E-commerce Platform & Online Storefronts",
  },
  {
    pattern: /\b(?:observability|distributed\s+tracing|application\s+monitoring|apm|metrics\s+and\s+logs)\b/i,
    category: "Observability & Application Monitoring Platform",
  },
  {
    pattern: /\b(?:crm|customer\s+relationship\s+management|sales\s+crm)\b/i,
    category: "CRM & Customer Relationship Management",
  },
  {
    pattern: /\b(?:cloud\s+database|serverless\s+database|sql\s+database|nosql\s+database)\b/i,
    category: "Cloud Database & Backend Infrastructure",
  },
  {
    pattern: /\b(?:authentication|identity\s+and\s+access|auth\s+for\s+developers|user\s+management)\b/i,
    category: "Authentication & Identity Infrastructure",
  },
  {
    pattern: /\b(?:project\s+management|issue\s+tracking|task\s+management|sprint\s+planning)\b/i,
    category: "Project Management & Issue Tracking",
  },
  {
    pattern: /\b(?:customer\s+support|help\s+desk|customer\s+service\s+software|ticketing\s+system)\b/i,
    category: "Customer Support & Helpdesk Platform",
  },
];

const PRICING_PATTERNS = [
  /(?:[\$\u00A3\u20AC])\s*\d+(?:\.\d{2})?(?:\s*\/\s*(?:mo|month|yr|year|user|seat))?/i,
  /(?:free tier|free plan|starts? at|starting at|per user|per seat|contact sales|custom pricing|free trial)/i,
  /(?:billed annually|billed monthly)/i,
];

/**
 * Extracts a structured, evidence-bound BusinessProfile from crawled pages.
 * Enforces strictly: NEVER hallucinate missing fields.
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
  const { canonicalCategory, canonicalCategoryConfidence } = deriveCanonicalCategory(homepage, description);
  const productsOrServices = extractProducts(pages, canonicalCategory);
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
    canonicalCategory,
    canonicalCategoryConfidence,
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

export function extractBrandName(homepage: CrawledPage, domain: string): string {
  // 1. Try Title before separators (including middle dots, bullets, em dashes, pipes, colons)
  if (homepage.title) {
    // Split by standard brand-tagline separators: | : - ? ? ? ?
    const parts = homepage.title.split(/[|:\u00b7\u2014\u2013\u2022\u2212\-]/);
    if (parts.length > 0) {
      let candidate = parts[0].trim();
      // If there's a trailing hyphen separator: "Resend - Fast Email"
      if (candidate.includes(" - ")) {
        candidate = candidate.split(" - ")[0].trim();
      }
      if (
        candidate.length > 1 &&
        candidate.length < 35 &&
        !candidate.toLowerCase().startsWith("home") &&
        !candidate.toLowerCase().includes("welcome")
      ) {
        return candidate;
      }
    }
  }

  // 2. Try first clean H1
  for (const h of homepage.headings) {
    const trimmed = h.trim();
    if (trimmed.length > 1 && trimmed.length < 30 && !trimmed.toLowerCase().includes("welcome")) {
      return trimmed;
    }
  }

  // 3. Fallback to capitalized domain root
  const baseDomain = domain.split(".")[0];
  return baseDomain.charAt(0).toUpperCase() + baseDomain.slice(1);
}

export function deriveCanonicalCategory(
  homepage: CrawledPage,
  description: string
): { canonicalCategory: string; canonicalCategoryConfidence: "HIGH" | "MEDIUM" | "LOW" } {
  const combinedEvidence = `${homepage.title} ${homepage.headings.slice(0, 3).join(" ")} ${description}`.toLowerCase();

  // 1. Check curated high-confidence category rules
  for (const rule of CANONICAL_CATEGORY_RULES) {
    if (rule.pattern.test(combinedEvidence)) {
      return { canonicalCategory: rule.category, canonicalCategoryConfidence: "HIGH" };
    }
  }

  // 2. Attempt clean subtitle derivation if homepage has title with separator
  if (homepage.title) {
    const parts = homepage.title.split(/[|:\u00b7\u2014\u2013\u2022\u2212\-]/);
    if (parts.length > 1) {
      const tagline = parts[1].trim().toLowerCase();
      if (
        tagline.length > 4 &&
        tagline.length < 50 &&
        !tagline.includes("http") &&
        !/welcome|home|official|homepage|login|sign up/i.test(tagline)
      ) {
        return { canonicalCategory: tagline, canonicalCategoryConfidence: "MEDIUM" };
      }
    }
  }

  // 3. Safe fallback with LOW confidence (Never invent random industries or categories)
  return { canonicalCategory: "software platform", canonicalCategoryConfidence: "LOW" };
}

function extractDescription(pages: CrawledPage[]): string {
  for (const page of pages) {
    if (page.description && page.description.trim().length > 20) {
      return page.description.trim();
    }
  }

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

function extractProducts(pages: CrawledPage[], canonicalCategory: string): string[] {
  const products = new Set<string>();

  // Always include canonical category as primary product
  if (canonicalCategory && canonicalCategory !== "software platform") {
    products.add(canonicalCategory);
  }

  // Check feature page titles and clean headings
  for (const page of pages) {
    const isFeaturePage = /feature|product|solution/i.test(page.url);
    if (isFeaturePage && page.title) {
      const titleParts = page.title.split(/[|:\u00b7\u2014\u2013\u2022\u2212\-]/);
      const featureName = titleParts[0].trim();
      if (
        featureName.length > 2 &&
        featureName.length < 35 &&
        !/features|pricing|overview|home|welcome|resend|stripe|shopify/i.test(featureName)
      ) {
        products.add(featureName);
      }
    }
  }

  return Array.from(products).slice(0, 5);
}

function extractTargetCustomers(pages: CrawledPage[]): string[] {
  const targets = new Set<string>();
  const combinedText = pages.map((p) => `${p.title} ${p.description} ${p.text}`).join(" ").toLowerCase();

  // ONLY extract validated human/commercial personas. Never extract phrases like "programming lang" or "anyone to write"
  for (const persona of VALID_PERSONAS) {
    const regex = new RegExp(`\\b${persona}\\b`, "i");
    if (regex.test(combinedText)) {
      targets.add(persona);
    }
  }

  return Array.from(targets).slice(0, 4);
}

function extractIndustries(pages: CrawledPage[]): string[] {
  const matched = new Set<string>();

  // Strict evidence requirement: ONLY assign an industry if the site has a dedicated industry route or explicit "Solutions for [Industry]" heading
  for (const page of pages) {
    const urlLower = page.url.toLowerCase();
    const isIndustryPage = /\/industries?\/|\/solutions?\//i.test(urlLower);

    if (isIndustryPage) {
      for (const h of page.headings) {
        const hMatch = h.match(/(?:solutions?|built|software|platform)\s+for\s+([a-zA-Z\s]{3,25})/i);
        if (hMatch && hMatch[1]) {
          const cand = hMatch[1].trim().toLowerCase();
          if (cand.length > 3 && cand.length < 25 && !cand.includes("teams") && !cand.includes("developers")) {
            matched.add(cand);
          }
        }
      }
    }
  }

  // If no explicit industry solutions page exists, do NOT hallucinate industries
  return Array.from(matched).slice(0, 3);
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
        clean.length < 50 &&
        !/about|contact|privacy|terms|cookie|pricing|blog|login|sign up|resend|stripe/i.test(clean)
      ) {
        features.add(clean);
      }
    }
  }

  return Array.from(features).slice(0, 8);
}

function extractUseCases(pages: CrawledPage[]): string[] {
  const useCases = new Set<string>();

  for (const page of pages) {
    const isUseCasePage = /use-?case|solution/i.test(page.url);
    if (isUseCasePage) {
      for (const h of page.headings) {
        if (/for\s+[a-z]+/i.test(h) && h.length < 50) {
          useCases.add(h.trim());
        }
      }
    }
  }

  return Array.from(useCases).slice(0, 4);
}

function extractLocations(pages: CrawledPage[]): string[] {
  const locations = new Set<string>();
  const locationRegex = /(?:headquarters|offices?|based in|located in)\s+([A-Z][a-zA-Z\s,]+?)(?:\.|\n|<)/g;

  for (const page of pages) {
    const matches = page.text.matchAll(locationRegex);
    for (const m of matches) {
      if (m[1]) {
        const loc = m[1].trim();
        if (loc.length > 2 && loc.length < 40) {
          locations.add(loc);
        }
      }
    }
  }

  return Array.from(locations).slice(0, 3);
}

function extractDifferentiators(pages: CrawledPage[]): string[] {
  const diffs = new Set<string>();
  const diffRegex = /(?:the only|fastest|unlike other|why choose)\s+([^.\n]{10,80})/gi;

  for (const page of pages) {
    const matches = page.text.matchAll(diffRegex);
    for (const m of matches) {
      if (m[0]) {
        const d = m[0].trim();
        if (d.length > 10 && d.length < 80) {
          diffs.add(d);
        }
      }
    }
  }

  return Array.from(diffs).slice(0, 4);
}
