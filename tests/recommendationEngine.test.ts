import { describe, it, expect } from "vitest";
import { generateActionableRecommendations } from "../src/recommendations/recommendationEngine";
import { BusinessProfile, Citation, CompetitorMention, QuestionResult, VisibilityScoreBreakdown } from "../src/types";

describe("Prescriptive Recommendation Engine", () => {
  const profileWithoutPricing: BusinessProfile = {
    name: "AnalyticsPro",
    domain: "analyticspro.io",
    description: "Enterprise user analytics platform.",
    productsOrServices: ["User Analytics"],
    targetCustomers: ["Product Managers"],
    industries: ["SaaS"],
    pricingSignals: [], // No pricing signals detected
    keyFeatures: ["Funnel Analysis"],
    useCases: ["Churn reduction"],
    locations: [],
    differentiators: ["10x faster query engine"],
    sourcePages: ["https://analyticspro.io"],
  };

  const score: VisibilityScoreBreakdown = {
    overallScore: 25,
    recommendationRate: 20,
    topRecommendationRate: 0,
    considerationRate: 40,
    totalQuestionsEvaluated: 5,
  };

  const competitors: CompetitorMention[] = [
    {
      name: "Mixpanel",
      rank: 1,
      posture: "TOP_RECOMMENDATION",
      frequency: 4,
      supportingCitations: ["https://g2.com/mixpanel"],
    },
  ];

  const citations: Citation[] = [
    {
      url: "https://g2.com/categories/analytics",
      domain: "g2.com",
      category: "REVIEW_SITE",
      supportsBrand: false, // Target brand not listed on G2
      frequency: 3,
    },
  ];

  it("generates high-priority prescriptions for missing review presence and pricing transparency", () => {
    const items = generateActionableRecommendations(
      score,
      [] as QuestionResult[],
      competitors,
      citations,
      profileWithoutPricing
    );

    expect(items.length).toBeGreaterThanOrEqual(3);

    const reviewAction = items.find((i) => i.id === "rec_citations");
    expect(reviewAction).toBeDefined();
    expect(reviewAction?.priority).toBe("HIGH");

    const pricingAction = items.find((i) => i.id === "rec_pricing");
    expect(pricingAction).toBeDefined();
    expect(pricingAction?.priority).toBe("HIGH");

    const competitorAction = items.find((i) => i.id === "rec_differentiation");
    expect(competitorAction).toBeDefined();
    expect(competitorAction?.description).toContain("Mixpanel");
  });
});
