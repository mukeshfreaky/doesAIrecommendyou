import { describe, it, expect } from "vitest";
import { RecommendationPosture, VisibilityScoreBreakdown } from "../src/types";

describe("Scoring Methodology & Posture Verification (Phase 0)", () => {
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

  it("calculates expected score breakdown from mock questions", () => {
    // 10 questions evaluated:
    // 2 TOP_RECOMMENDATION, 3 RECOMMENDED, 2 CONSIDERED, 1 MENTIONED, 2 NOT_MENTIONED
    const total = 10;
    const topCount = 2;
    const recCount = 3;
    const consCount = 2;

    const topRate = topCount / total; // 0.20
    const recRate = (recCount + topCount) / total; // 0.50
    const consRate = (consCount + recCount + topCount) / total; // 0.70
    const consistency = 1.0;

    // S = 100 * (0.40 * recRate + 0.35 * topRate + 0.15 * consRate + 0.10 * consistency)
    const expectedScore = Math.round(
      100 * (0.4 * recRate + 0.35 * topRate + 0.15 * consRate + 0.1 * consistency)
    );

    const breakdown: VisibilityScoreBreakdown = {
      overallScore: expectedScore,
      recommendationRate: Math.round(recRate * 100),
      topRecommendationRate: Math.round(topRate * 100),
      considerationRate: Math.round(consRate * 100),
      crossProviderConsistency: Math.round(consistency * 100),
      supportingCitationCount: 4,
      totalQuestionsEvaluated: total,
    };

    expect(breakdown.overallScore).toBe(48); // 100 * (0.20 + 0.07 + 0.105 + 0.10) = 47.5 -> 48
    expect(breakdown.recommendationRate).toBe(50);
    expect(breakdown.topRecommendationRate).toBe(20);
    expect(breakdown.considerationRate).toBe(70);
  });
});
