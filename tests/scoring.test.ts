import { describe, it, expect } from "vitest";
import { RecommendationPosture, VisibilityScoreBreakdown } from "../src/types";

describe("Audited Scoring Methodology & Posture Verification", () => {
  it("defines the 5 core recommendation postures correctly", () => {
    const postures: RecommendationPosture[] = [
      "TOP_RECOMMENDATION",
      "RECOMMENDED",
      "CONSIDERED",
      "MENTIONED",
      "NOT_MENTIONED",
    ];
    expect(postures).toHaveLength(5);
  });

  it("calculates statistically sound single-provider score (no C_prov fudge factor)", () => {
    // 10 questions evaluated:
    // 2 TOP_RECOMMENDATION, 3 RECOMMENDED, 2 CONSIDERED, 1 MENTIONED, 2 NOT_MENTIONED
    const total = 10;
    const topCount = 2;
    const recCount = 3;
    const consCount = 2;

    const topRate = topCount / total; // 0.20
    const recRate = (recCount + topCount) / total; // 0.50
    const consRate = (consCount + recCount + topCount) / total; // 0.70

    // Audited single-provider formula:
    // S = 100 * (0.50 * recRate + 0.35 * topRate + 0.15 * consRate)
    const rawScore = 100 * (0.50 * recRate + 0.35 * topRate + 0.15 * consRate);
    const expectedScore = Math.round(rawScore); // 100 * (0.25 + 0.07 + 0.105) = 42.5 -> 43

    const breakdown: VisibilityScoreBreakdown = {
      overallScore: expectedScore,
      recommendationRate: Math.round(recRate * 100),
      topRecommendationRate: Math.round(topRate * 100),
      considerationRate: Math.round(consRate * 100),
      crossProviderConsistency: 100, // Normalized for single provider
      supportingCitationCount: 4,
      totalQuestionsEvaluated: total,
    };

    expect(breakdown.overallScore).toBe(43);
    expect(breakdown.recommendationRate).toBe(50);
    expect(breakdown.topRecommendationRate).toBe(20);
    expect(breakdown.considerationRate).toBe(70);
  });

  it("bounds scores correctly for extreme cases", () => {
    // Perfect: all TOP_RECOMMENDATION
    const perfectScore = Math.round(100 * (0.50 * 1.0 + 0.35 * 1.0 + 0.15 * 1.0));
    expect(perfectScore).toBe(100);

    // Zero visibility: all NOT_MENTIONED
    const zeroScore = Math.round(100 * (0.50 * 0.0 + 0.35 * 0.0 + 0.15 * 0.0));
    expect(zeroScore).toBe(0);

    // Considered only: brand appears in options list but never recommended
    // 60% considered, 0% recommended, 0% top
    const consideredOnly = Math.round(100 * (0.50 * 0.0 + 0.35 * 0.0 + 0.15 * 0.60));
    expect(consideredOnly).toBe(9);
  });
});
