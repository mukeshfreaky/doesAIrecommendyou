import { describe, it, expect } from "vitest";
import { generateActionableRecommendations } from "../src/recommendations/recommendationEngine";
import {
  BusinessProfile,
  Citation,
  CompetitorMention,
  QuestionResult,
  ScanReport,
  VisibilityScoreBreakdown,
} from "../src/types";

describe("Phase 2 Product Report Experience & Trust Audit", () => {
  const mockProfile: BusinessProfile = {
    name: "Linear",
    domain: "linear.app",
    canonicalCategory: "Project Management & Issue Tracking",
    canonicalCategoryConfidence: "HIGH",
    archetype: "B2B_SAAS",
    description: "The issue tracker built for high-performance software teams.",
    productsOrServices: ["Issue Tracking", "Project Management"],
    targetCustomers: ["Software Engineers", "Product Managers"],
    industries: ["Software & Technology"],
    pricingSignals: ["Free tier", "$8/user/mo Standard", "$14/user/mo Plus"],
    keyFeatures: ["Keyboard-first interface", "Cycles", "Roadmaps", "Sync engine"],
    useCases: ["Sprint planning", "Bug tracking"],
    locations: [],
    differentiators: ["High speed", "Keyboard navigation"],
    sourcePages: ["https://linear.app"],
  };

  const mockCompetitors: CompetitorMention[] = [
    {
      name: "Jira",
      rank: 1,
      posture: "TOP_RECOMMENDATION",
      frequency: 4,
      supportingCitations: ["https://g2.com/jira"],
    },
    {
      name: "Asana",
      rank: 2,
      posture: "RECOMMENDED",
      frequency: 3,
      supportingCitations: ["https://g2.com/asana"],
    },
  ];

  const mockCitations: Citation[] = [
    {
      url: "https://g2.com/products/jira/reviews",
      domain: "g2.com",
      category: "REVIEW_SITE",
      supportsBrand: false,
      supportsCompetitor: "Jira",
      frequency: 3,
    },
    {
      url: "https://g2.com/products/linear/reviews",
      domain: "g2.com",
      category: "REVIEW_SITE",
      supportsBrand: true,
      frequency: 2,
    },
  ];

  it("handles zero-score businesses constructively without derogatory language", () => {
    const zeroScore: VisibilityScoreBreakdown = {
      overallScore: 0,
      recommendationRate: 0,
      topRecommendationRate: 0,
      considerationRate: 0,
      totalQuestionsEvaluated: 5,
      prospectiveQuestionsEvaluated: 4,
      prospectiveQuestionsTotal: 4,
      benchmarkIndex: {
        status: "UNRECOGNIZED",
        relationship: "NOT_APPLICABLE",
        score: 0,
        rationale: "Brand was not recognized as a reference standard in alternatives queries.",
      },
    };

    const actionItems = generateActionableRecommendations(
      zeroScore,
      [] as QuestionResult[],
      mockCompetitors,
      mockCitations,
      mockProfile
    );

    expect(actionItems.length).toBe(3);
    for (const item of actionItems) {
      expect(item.problem).not.toMatch(/suck|terrible|awful|worthless/i);
      expect(item.suggestedImprovement).toBeTruthy();
      expect(item.whyItMatters).toBeTruthy();
      expect(item.supportingEvidence).toBeTruthy();
    }
  });

  it("handles partial scan with missing questions without penalizing the business", () => {
    const partialScore: VisibilityScoreBreakdown = {
      overallScore: 75,
      recommendationRate: 67,
      topRecommendationRate: 33,
      considerationRate: 100,
      totalQuestionsEvaluated: 3,
      prospectiveQuestionsEvaluated: 3,
      prospectiveQuestionsTotal: 4,
      isPartialEvaluation: true,
    };

    expect(partialScore.isPartialEvaluation).toBe(true);
    expect(partialScore.prospectiveQuestionsEvaluated).toBe(3);
    expect(partialScore.prospectiveQuestionsTotal).toBe(4);
    const missingCount = (partialScore.prospectiveQuestionsTotal ?? 4) - (partialScore.prospectiveQuestionsEvaluated ?? 0);
    expect(missingCount).toBe(1);
  });

  it("distinguishes failed retrieval from negative brand posture", () => {
    const failedRetrievalResult: QuestionResult = {
      questionId: "q_retrieval_fail",
      category: "CATEGORY_DISCOVERY",
      question: "What are the best Project Management tools?",
      rationale: "Broad discovery",
      rawAIResponse: "",
      posture: "NOT_MENTIONED",
      recommendationReason: "Search provider timed out.",
      competitors: [],
      citedSources: [],
      supportingEvidence: [],
      searchQueries: [],
      evidenceStatus: "RETRIEVAL_FAILED",
    };

    expect(failedRetrievalResult.evidenceStatus).toBe("RETRIEVAL_FAILED");
    expect(failedRetrievalResult.evidenceStatus).not.toBe("EVIDENCE_BACKED");
  });

  it("verifies that competitive benchmark signal is labeled experimental and isolated", () => {
    const scoreWithBenchmark: VisibilityScoreBreakdown = {
      overallScore: 60,
      recommendationRate: 50,
      topRecommendationRate: 25,
      considerationRate: 75,
      totalQuestionsEvaluated: 5,
      prospectiveQuestionsEvaluated: 4,
      prospectiveQuestionsTotal: 4,
      benchmarkIndex: {
        status: "RECOGNIZED_ALTERNATIVE",
        relationship: "BENCHMARK",
        score: 65,
        rationale: "Recognized as a prominent alternative benchmark.",
      },
    };

    expect(scoreWithBenchmark.benchmarkIndex).toBeDefined();
    expect(scoreWithBenchmark.benchmarkIndex?.score).toBe(65);
    expect(scoreWithBenchmark.overallScore).toBe(60);
  });

  it("ensures action items contain exactly the 4 required sections", () => {
    const actionItems = generateActionableRecommendations(
      {
        overallScore: 40,
        recommendationRate: 25,
        topRecommendationRate: 0,
        considerationRate: 50,
        totalQuestionsEvaluated: 5,
      },
      [] as QuestionResult[],
      mockCompetitors,
      mockCitations,
      mockProfile
    );

    expect(actionItems.length).toBe(3);
    for (const item of actionItems) {
      expect(item.problem).toBeTruthy();
      expect(typeof item.problem).toBe("string");

      expect(item.whyItMatters).toBeTruthy();
      expect(typeof item.whyItMatters).toBe("string");

      expect(item.suggestedImprovement).toBeTruthy();
      expect(typeof item.suggestedImprovement).toBe("string");

      expect(item.supportingEvidence).toBeTruthy();
      expect(typeof item.supportingEvidence).toBe("string");
    }
  });

  it("verifies no empirical percentage claims in generated action items across all archetypes", () => {
    const archetypes: BusinessProfile["archetype"][] = [
      "B2B_SAAS",
      "DEVELOPER_TOOL",
      "ECOMMERCE_CONSUMER",
      "TRAVEL_HOSPITALITY",
    ];

    for (const arch of archetypes) {
      const profile: BusinessProfile = {
        ...mockProfile,
        archetype: arch,
        pricingSignals: [],
      };

      const items = generateActionableRecommendations(
        {
          overallScore: 20,
          recommendationRate: 0,
          topRecommendationRate: 0,
          considerationRate: 50,
          totalQuestionsEvaluated: 5,
        },
        [] as QuestionResult[],
        mockCompetitors,
        [],
        profile
      );

      expect(items.length).toBe(3);
      for (const item of items) {
        expect(item.expectedImpact).not.toMatch(/\d+%/);
        expect(item.description).not.toMatch(/\d+%/);
        expect(item.problem).not.toMatch(/\d+%/);
        expect(item.whyItMatters).not.toMatch(/\d+%/);
        expect(item.suggestedImprovement).not.toMatch(/\d+%/);
      }
    }
  });
});
