import { describe, it, expect } from "vitest";
import { crawlWebsite } from "../src/crawler/crawler";
import { extractBusinessProfile } from "../src/crawler/extractor";
import { generateBuyerQuestions, formatDelimitedEvidence, SYSTEM_EVALUATOR_INSTRUCTION } from "../src/generator/questionGenerator";
import { MockProvider } from "../src/providers/mock";
import { classifyPosture } from "../src/analysis/postureClassifier";
import { detectCompetitors } from "../src/analysis/competitorDetector";
import { aggregateCitations } from "../src/analysis/citationAnalyzer";
import { calculateVisibilityScore } from "../src/scoring/scoringEngine";
import { generateActionableRecommendations } from "../src/recommendations/recommendationEngine";
import { CrawledPage, QuestionResult, ScanReport } from "../src/types";

describe("Complete Vertical Pipeline Integration", () => {
  const crawledPages: CrawledPage[] = [
    {
      url: "https://acme-analytics.io",
      title: "Acme Analytics | Product Analytics Platform",
      description: "Acme Analytics provides real-time event analytics for product teams.",
      headings: ["Product Analytics for Modern SaaS", "Features", "Pricing"],
      text: "Acme Analytics helps SaaS product teams track user journeys in real-time. Transparent pricing starting at $99/mo.",
      links: ["https://acme-analytics.io/pricing"],
      fetchedAt: new Date().toISOString(),
    },
    {
      url: "https://acme-analytics.io/pricing",
      title: "Pricing | Acme Analytics",
      description: "Plans starting at $99/mo with free tier.",
      headings: ["Pricing Plans"],
      text: "Starter plan: $99/mo. Enterprise custom pricing. Free 14-day trial.",
      links: [],
      fetchedAt: new Date().toISOString(),
    },
  ];

  it("executes complete pipeline from pages to final ScanReport with no fabricated metrics", async () => {
    // 1. Evidence extraction
    const profile = extractBusinessProfile(crawledPages, "https://acme-analytics.io");
    expect(profile.name).toBe("Acme Analytics");
    expect(profile.domain).toBe("acme-analytics.io");
    expect(profile.pricingSignals.length).toBeGreaterThan(0);

    // 2. Question generation
    const questions = generateBuyerQuestions(profile);
    expect(questions).toHaveLength(5);

    // 3. Provider execution (MockProvider)
    const mockProvider = new MockProvider();
    const delimitedEvidence = formatDelimitedEvidence(profile);
    const systemPrompt = `${SYSTEM_EVALUATOR_INSTRUCTION}\n\nBUSINESS EVIDENCE:\n${delimitedEvidence}`;

    const questionResults: QuestionResult[] = [];
    const rawResponses: Array<{ text: string; citations?: string[] }> = [];

    for (const q of questions) {
      const res = await mockProvider.generateResponse(q.question, systemPrompt, { enableSearchGrounding: true });
      const posture = classifyPosture(profile.name, profile.domain, res.content);

      questionResults.push({
        questionId: q.id,
        category: q.category,
        question: q.question,
        rationale: q.rationale,
        rawAIResponse: res.content,
        posture: posture.posture,
        brandRank: posture.brandRank,
        recommendationReason: posture.recommendationReason,
        competitors: [],
        citedSources: res.citations,
        supportingEvidence: posture.supportingEvidence,
        searchQueries: res.groundingQueries,
      });

      rawResponses.push({
        text: res.content,
        citations: res.citations.map((c) => c.url),
      });
    }

    expect(questionResults).toHaveLength(5);

    // 4. Competitor detection
    const competitors = detectCompetitors(rawResponses, profile.name, profile.domain);
    expect(competitors.length).toBeGreaterThan(0);

    // 5. Citation aggregation
    const citations = aggregateCitations(
      questionResults.map((r) => r.citedSources),
      profile.domain,
      profile.name
    );
    expect(citations.length).toBeGreaterThan(0);

    // 6. Scoring
    const score = calculateVisibilityScore(questionResults);
    expect(score.overallScore).toBeGreaterThanOrEqual(0);
    expect(score.overallScore).toBeLessThanOrEqual(100);
    // Crucial: Single provider MUST NOT populate crossProviderConsistency
    expect(score.crossProviderConsistency).toBeUndefined();

    // 7. Prescriptive recommendations
    const actionItems = generateActionableRecommendations(
      score,
      questionResults,
      competitors,
      citations,
      profile
    );
    expect(actionItems.length).toBeGreaterThan(0);

    // 8. Final ScanReport assembly
    const scanReport: ScanReport = {
      scanId: "scan_test_full_pipeline",
      domain: profile.domain,
      businessProfile: profile,
      questions,
      questionResults,
      competitors,
      score,
      actionItems,
      evidence: {
        crawledPagesCount: crawledPages.length,
        sourcePages: crawledPages.map((p) => p.url),
      },
      providerMetadata: {
        providerId: mockProvider.id,
        modelId: mockProvider.modelId,
        searchGroundingEnabled: true,
        searchQueriesExecuted: 10,
        estimatedCostUSD: 0.35,
        latencyMs: 500,
      },
      generatedAt: new Date().toISOString(),
    };

    expect(scanReport.scanId).toBe("scan_test_full_pipeline");
    expect(scanReport.score.crossProviderConsistency).toBeUndefined();
    expect(scanReport.actionItems.length).toBeGreaterThan(0);
  });
});
