import { describe, it, expect } from "vitest";
import { extractBusinessProfile } from "../src/crawler/extractor";
import { CrawledPage } from "../src/types";

describe("Business Profile Evidence Extractor", () => {
  const samplePages: CrawledPage[] = [
    {
      url: "https://hypermetrics.io",
      title: "HyperMetrics | Real-Time Observability & Monitoring Platform",
      description: "HyperMetrics provides cloud-native observability for DevOps teams and high-scale engineering organizations.",
      headings: [
        "Cloud-Native Observability Platform",
        "Built for DevOps and Site Reliability Engineers",
        "Key Capabilities",
        "Distributed Tracing",
        "Metric Aggregation Engine",
      ],
      text: "HyperMetrics empowers modern devops engineers to detect incidents in seconds. Unlike legacy monitoring tools, our distributed platform correlates logs, traces, and metrics automatically.",
      links: ["https://hypermetrics.io/pricing", "https://hypermetrics.io/features"],
      fetchedAt: new Date().toISOString(),
    },
    {
      url: "https://hypermetrics.io/pricing",
      title: "Pricing Plans | HyperMetrics",
      description: "Transparent pricing starting at $49/mo for growing teams.",
      headings: ["Transparent Pricing", "Developer Tier", "Enterprise Tier"],
      text: "Developer plan starts at $49/mo with unlimited traces. Free tier available for small projects. Contact sales for custom enterprise volume.",
      links: [],
      fetchedAt: new Date().toISOString(),
    },
  ];

  it("extracts brand name and clean domain without hallucination", () => {
    const profile = extractBusinessProfile(samplePages, "https://hypermetrics.io");
    expect(profile.name).toBe("HyperMetrics");
    expect(profile.domain).toBe("hypermetrics.io");
  });

  it("extracts description from meta tags", () => {
    const profile = extractBusinessProfile(samplePages, "https://hypermetrics.io");
    expect(profile.description).toContain("cloud-native observability");
  });

  it("extracts target customers and canonical category with high confidence", () => {
    const profile = extractBusinessProfile(samplePages, "https://hypermetrics.io");
    expect(profile.targetCustomers.some((c) => c.toLowerCase().includes("devops"))).toBe(true);
    expect(profile.canonicalCategory).toContain("Observability");
    expect(profile.canonicalCategoryConfidence).toBe("HIGH");
    // Strictly no hallucinated industries when no dedicated solution page exists
    expect(profile.industries).toEqual([]);
  });

  it("extracts industries only when dedicated solution routes exist", () => {
    const pagesWithSolution: CrawledPage[] = [
      ...samplePages,
      {
        url: "https://hypermetrics.io/solutions/fintech",
        title: "Observability for Financial Services | HyperMetrics",
        description: "Reliable observability for high-throughput financial transactions.",
        headings: ["Solutions for Financial Services", "Compliance & Latency"],
        text: "Financial institutions rely on HyperMetrics for transaction tracing.",
        links: [],
        fetchedAt: new Date().toISOString(),
      },
    ];
    const profile = extractBusinessProfile(pagesWithSolution, "https://hypermetrics.io");
    expect(profile.industries).toContain("financial services");
  });

  it("extracts pricing signals accurately from pricing pages", () => {
    const profile = extractBusinessProfile(samplePages, "https://hypermetrics.io");
    expect(profile.pricingSignals.some((p) => p.includes("$49"))).toBe(true);
  });

  it("handles websites with no pricing signals without inventing fake prices", () => {
    const noPricingPages: CrawledPage[] = [
      {
        url: "https://secretconsulting.com",
        title: "Secret Consulting | Strategy Advisory",
        description: "Bespoke executive consulting for multinational enterprises.",
        headings: ["Advisory Services"],
        text: "We provide high-touch advisory services to Fortune 500 boards.",
        links: [],
        fetchedAt: new Date().toISOString(),
      },
    ];

    const profile = extractBusinessProfile(noPricingPages, "https://secretconsulting.com");
    expect(profile.pricingSignals).toHaveLength(0);
  });
});
