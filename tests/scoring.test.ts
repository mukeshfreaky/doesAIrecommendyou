import { describe, it, expect } from "vitest";
import { RecommendationPosture, VisibilityScoreBreakdown } from "../src/types";
import { calculateVisibilityScore } from "../src/scoring/scoringEngine";

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
      supportingCitationCount: 4,
      totalQuestionsEvaluated: total,
    };

    expect(breakdown.overallScore).toBe(43);
    expect(breakdown.recommendationRate).toBe(50);
    expect(breakdown.topRecommendationRate).toBe(20);
    expect(breakdown.considerationRate).toBe(70);
    expect(breakdown.crossProviderConsistency).toBeUndefined();
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

  it("ensures calculateVisibilityScore does not populate fabricated crossProviderConsistency", () => {
        const result = calculateVisibilityScore([
      {
        questionId: "q1",
        category: "CATEGORY_DISCOVERY",
        question: "test",
        rationale: "test",
        rawAIResponse: "test",
        posture: "TOP_RECOMMENDATION",
        recommendationReason: "test",
        competitors: [],
        citedSources: [],
        supportingEvidence: [],
        searchQueries: [],
      }
    ]);

    expect(result.crossProviderConsistency).toBeUndefined();
    expect(result.overallScore).toBe(100);
    expect(result.prospectiveQuestionsEvaluated).toBe(1);
    expect(result.isPartialEvaluation).toBe(true);
  });

  describe("Prospective AI Recommendation Score vs Brand Authority / Benchmark Index", () => {
    const mockQuestion = (category: any, posture: any, altRel?: any) => ({
      questionId: `q_${category}`,
      category,
      question: "Sample question?",
      rationale: "Rationale",
      rawAIResponse: "AI Response",
      posture,
      alternativeRelationship: altRel,
      recommendationReason: "Reason",
      competitors: [],
      citedSources: [],
      supportingEvidence: [],
      searchQueries: [],
    });

    it("calculates AI Recommendation Score strictly from prospective buyer intents, excluding ALTERNATIVES", () => {
      // 4 prospective questions:
      // Q1 (CATEGORY_DISCOVERY): TOP_RECOMMENDATION
      // Q2 (BEST_OF): RECOMMENDED
      // Q3 (USE_CASE): RECOMMENDED
      // Q4 (FEATURE_SPECIFIC): CONSIDERED
      // 1 alternative question:
      // Q5 (ALTERNATIVES): CONSIDERED, BENCHMARK
      const results = [
        mockQuestion("CATEGORY_DISCOVERY", "TOP_RECOMMENDATION"),
        mockQuestion("BEST_OF", "RECOMMENDED"),
        mockQuestion("USE_CASE", "RECOMMENDED"),
        mockQuestion("FEATURE_SPECIFIC", "CONSIDERED"),
        mockQuestion("ALTERNATIVES", "CONSIDERED", "BENCHMARK"),
      ];

      const score = calculateVisibilityScore(results);

      // Prospective counts:
      // total evaluated prospective = 4
      // topCount = 1 (rate = 0.25)
      // recCount = 3 (rate = 0.75)
      // consCount = 4 (rate = 1.0)
      // rawScore = 100 * (0.50 * 0.75 + 0.35 * 0.25 + 0.15 * 1.0) = 100 * (0.375 + 0.0875 + 0.15) = 61.25 -> 61
      expect(score.prospectiveQuestionsEvaluated).toBe(4);
      expect(score.prospectiveQuestionsTotal).toBe(4);
      expect(score.isPartialEvaluation).toBe(false);
      expect(score.topRecommendationRate).toBe(25);
      expect(score.recommendationRate).toBe(75);
      expect(score.considerationRate).toBe(100);
      expect(score.overallScore).toBe(61);

      // ALTERNATIVES question must NOT alter prospective counts, but populates benchmarkIndex
      expect(score.benchmarkIndex).toBeDefined();
      expect(score.benchmarkIndex?.status).toBe("ESTABLISHED_BENCHMARK");
      expect(score.benchmarkIndex?.relationship).toBe("BENCHMARK");
      expect(score.benchmarkIndex?.score).toBe(85);
    });

    it("computes Benchmark Index correctly for DEFENDED, DISPLACED, and UNRECOGNIZED alternative outcomes", () => {
      // Defended outcome
      const defendedScore = calculateVisibilityScore([
        mockQuestion("CATEGORY_DISCOVERY", "RECOMMENDED"),
        mockQuestion("ALTERNATIVES", "CONSIDERED", "DEFENDED"),
      ]);
      expect(defendedScore.benchmarkIndex?.status).toBe("ESTABLISHED_BENCHMARK");
      expect(defendedScore.benchmarkIndex?.relationship).toBe("DEFENDED");
      expect(defendedScore.benchmarkIndex?.score).toBe(100);

      // Displaced outcome
      const displacedScore = calculateVisibilityScore([
        mockQuestion("CATEGORY_DISCOVERY", "RECOMMENDED"),
        mockQuestion("ALTERNATIVES", "MENTIONED", "DISPLACED"),
      ]);
      expect(displacedScore.benchmarkIndex?.status).toBe("DISPLACED_INCUMBENT");
      expect(displacedScore.benchmarkIndex?.relationship).toBe("DISPLACED");
      expect(displacedScore.benchmarkIndex?.score).toBe(40);

      // Unrecognized outcome
      const unrecognizedScore = calculateVisibilityScore([
        mockQuestion("CATEGORY_DISCOVERY", "RECOMMENDED"),
        mockQuestion("ALTERNATIVES", "NOT_MENTIONED", "NOT_APPLICABLE"),
      ]);
      expect(unrecognizedScore.benchmarkIndex?.status).toBe("UNRECOGNIZED");
      expect(unrecognizedScore.benchmarkIndex?.score).toBe(0);
    });

    it("gracefully handles partial evaluations (e.g. 3 of 4 prospective questions due to timeout)", () => {
      // Only 3 prospective questions completed:
      // 1 TOP_RECOMMENDATION, 1 RECOMMENDED, 1 NOT_MENTIONED
      const results = [
        mockQuestion("CATEGORY_DISCOVERY", "TOP_RECOMMENDATION"),
        mockQuestion("BEST_OF", "RECOMMENDED"),
        mockQuestion("USE_CASE", "NOT_MENTIONED"),
      ];

      const score = calculateVisibilityScore(results);

      expect(score.prospectiveQuestionsEvaluated).toBe(3);
      expect(score.prospectiveQuestionsTotal).toBe(4);
      expect(score.isPartialEvaluation).toBe(true);
      // Rates calculated against the 3 evaluated:
      // topRate: 1/3 (33%)
      // recRate: 2/3 (67%)
      // consRate: 2/3 (67%)
      expect(score.topRecommendationRate).toBe(33);
      expect(score.recommendationRate).toBe(67);
      expect(score.considerationRate).toBe(67);
      expect(score.overallScore).toBeGreaterThan(0);
      expect(score.benchmarkIndex?.status).toBe("NOT_EVALUATED");
    });

    it("gracefully handles zero completed evaluations without dividing by zero", () => {
      const score = calculateVisibilityScore([]);

      expect(score.overallScore).toBe(0);
      expect(score.recommendationRate).toBe(0);
      expect(score.topRecommendationRate).toBe(0);
      expect(score.considerationRate).toBe(0);
      expect(score.totalQuestionsEvaluated).toBe(0);
      expect(score.prospectiveQuestionsEvaluated).toBe(0);
      expect(score.prospectiveQuestionsTotal).toBe(4);
      expect(score.isPartialEvaluation).toBe(true);
      expect(score.benchmarkIndex?.status).toBe("NOT_EVALUATED");
    });
  });
});

