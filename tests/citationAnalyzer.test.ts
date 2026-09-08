import { describe, it, expect } from "vitest";
import { aggregateCitations, categorizeDomain } from "../src/analysis/citationAnalyzer";
import { Citation } from "../src/types";

describe("Citation Analyzer & Categorization", () => {
  it("categorizes well-known domains accurately", () => {
    expect(categorizeDomain("g2.com")).toBe("REVIEW_SITE");
    expect(categorizeDomain("capterra.com")).toBe("REVIEW_SITE");
    expect(categorizeDomain("reddit.com")).toBe("COMMUNITY_FORUM");
    expect(categorizeDomain("techcrunch.com")).toBe("NEWS");
    expect(categorizeDomain("docs.github.com")).toBe("DOCUMENTATION");
    expect(categorizeDomain("alternativeto.net")).toBe("DIRECTORY");
  });

  it("aggregates and flags brand-supporting citations", () => {
    const list1: Citation[] = [
      {
        url: "https://www.g2.com/products/stripe/reviews",
        domain: "g2.com",
        title: "Stripe Reviews 2026 - G2",
        category: "REVIEW_SITE",
        supportsBrand: false,
        frequency: 1,
      },
    ];

    const list2: Citation[] = [
      {
        url: "https://www.g2.com/products/stripe/reviews",
        domain: "g2.com",
        title: "Stripe Reviews 2026 - G2",
        category: "REVIEW_SITE",
        supportsBrand: false,
        frequency: 1,
      },
      {
        url: "https://techcrunch.com/fintech-roundup",
        domain: "techcrunch.com",
        title: "Fintech Startup Roundup",
        category: "NEWS",
        supportsBrand: false,
        frequency: 1,
      },
    ];

    const aggregated = aggregateCitations([list1, list2], "stripe.com", "Stripe");

    expect(aggregated).toHaveLength(2);
    const stripeCite = aggregated.find((c) => c.domain === "g2.com");
    expect(stripeCite?.frequency).toBe(2);
    expect(stripeCite?.supportsBrand).toBe(true);
  });
});
