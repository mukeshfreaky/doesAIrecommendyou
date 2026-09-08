import { describe, it, expect, beforeEach } from "vitest";
import {
  saveScanReport,
  getRecentScanForDomain,
  resetScanStorage,
  DOMAIN_COOLDOWN_MS,
} from "../src/lib/scanStorage";
import { ScanReport } from "../src/types";

describe("12-Hour Domain Cooldown & Storage", () => {
  beforeEach(() => {
    resetScanStorage();
  });

  const mockReport: ScanReport = {
    scanId: "scan_test_123",
    domain: "stripe.com",
    businessProfile: {
      name: "Stripe",
      domain: "stripe.com",
      canonicalCategory: "Payment Processing & Financial Infrastructure",
      canonicalCategoryConfidence: "HIGH",
      description: "Financial infrastructure for the internet",
      productsOrServices: ["Payment Processing"],
      targetCustomers: ["Developers", "Enterprises"],
      industries: ["Fintech"],
      pricingSignals: ["2.9% + 30c"],
      keyFeatures: ["Global Payments"],
      useCases: ["Billing"],
      locations: ["San Francisco"],
      differentiators: ["Developer-first APIs"],
      sourcePages: ["https://stripe.com"],
    },
    questions: [],
    questionResults: [],
    competitors: [],
    score: {
      overallScore: 85,
      recommendationRate: 80,
      topRecommendationRate: 60,
      considerationRate: 100,
      totalQuestionsEvaluated: 5,
    },
    actionItems: [],
    evidence: {
      crawledPagesCount: 2,
      sourcePages: ["https://stripe.com"],
    },
    providerMetadata: {
      providerId: "google_gemini",
      modelId: "gemini-3.8-flash",
      searchGroundingEnabled: true,
      searchGroundingStatus: "GROUNDED",
      searchQueriesExecuted: 5,
      estimatedCostUSD: 0.175,
      latencyMs: 1200,
    },
    generatedAt: new Date().toISOString(),
  };

  it("sets DOMAIN_COOLDOWN_MS to exactly 12 hours (43,200,000 ms)", () => {
    expect(DOMAIN_COOLDOWN_MS).toBe(12 * 60 * 60 * 1000);
  });

  it("returns cached report when domain is scanned within 12 hours", () => {
    saveScanReport(mockReport);

    const recent = getRecentScanForDomain("stripe.com");
    expect(recent).not.toBeNull();
    expect(recent?.report.scanId).toBe("scan_test_123");
    expect(recent?.ageMs).toBeLessThan(1000);
  });

  it("normalizes www prefix when checking domain cooldown", () => {
    saveScanReport(mockReport);

    const recentWithWww = getRecentScanForDomain("www.stripe.com");
    expect(recentWithWww).not.toBeNull();
    expect(recentWithWww?.report.domain).toBe("stripe.com");
  });

  it("returns null for unscanned domains", () => {
    const recent = getRecentScanForDomain("unscanned-domain.com");
    expect(recent).toBeNull();
  });
});
