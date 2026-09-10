import { BenchmarkIndexBreakdown, QuestionResult, VisibilityScoreBreakdown } from "@/types";

const PROSPECTIVE_INTENTS: ReadonlySet<string> = new Set([
  "CATEGORY_DISCOVERY",
  "BEST_OF",
  "USE_CASE",
  "FEATURE_SPECIFIC",
  "INDUSTRY",
  "COMPANY_SIZE",
  "PRICE_VALUE",
  "EASE_OF_USE",
]);

const ALTERNATIVE_INTENTS: ReadonlySet<string> = new Set([
  "ALTERNATIVES",
  "COMPETITOR_COMPARISON",
  "SWITCHING",
]);

export const EXPECTED_PROSPECTIVE_QUESTIONS = 4;

/**
 * Calculates the separated AI Recommendation Score (prospective buyer intents)
 * and Brand Authority / Benchmark Index (alternatives intent).
 *
 * Primary Prospective Score formula:
 * S = 100 * (0.50 * R_rec + 0.35 * R_top + 0.15 * R_cons)
 */
export function calculateVisibilityScore(
  results: QuestionResult[],
  expectedProspectiveTotal: number = EXPECTED_PROSPECTIVE_QUESTIONS
): VisibilityScoreBreakdown {
  const total = results.length;
  const supportingCitationCount = results.reduce(
    (acc, r) => acc + (r.citedSources ? r.citedSources.filter((c) => c.supportsBrand).length : 0),
    0
  );

  // 1. Separate prospective buyer queries from alternatives/switching queries
  const prospectiveResults = results.filter((r) => PROSPECTIVE_INTENTS.has(r.category));
  const alternativeResults = results.filter((r) => ALTERNATIVE_INTENTS.has(r.category));

  // Compute Benchmark Index from alternatives
  const benchmarkIndex = computeBenchmarkIndex(alternativeResults);

  const prospectiveEvaluated = prospectiveResults.length;
  const isPartial = prospectiveEvaluated < expectedProspectiveTotal;

  if (prospectiveEvaluated === 0) {
    return {
      overallScore: 0,
      recommendationRate: 0,
      topRecommendationRate: 0,
      considerationRate: 0,
      supportingCitationCount,
      totalQuestionsEvaluated: total,
      prospectiveQuestionsEvaluated: 0,
      prospectiveQuestionsTotal: expectedProspectiveTotal,
      benchmarkIndex,
      isPartialEvaluation: true,
    };
  }

  let topCount = 0;
  let recCount = 0;
  let consCount = 0;

  for (const r of prospectiveResults) {
    if (r.posture === "TOP_RECOMMENDATION") {
      topCount++;
      recCount++;
      consCount++;
    } else if (r.posture === "RECOMMENDED") {
      recCount++;
      consCount++;
    } else if (r.posture === "CONSIDERED") {
      consCount++;
    }
  }

  const topRate = topCount / prospectiveEvaluated;
  const recRate = recCount / prospectiveEvaluated;
  const consRate = consCount / prospectiveEvaluated;

  // Single-provider audited formula across prospective buyer evaluations
  const rawScore = 100 * (0.50 * recRate + 0.35 * topRate + 0.15 * consRate);
  const overallScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  return {
    overallScore,
    recommendationRate: Math.round(recRate * 100),
    topRecommendationRate: Math.round(topRate * 100),
    considerationRate: Math.round(consRate * 100),
    supportingCitationCount,
    totalQuestionsEvaluated: total,
    prospectiveQuestionsEvaluated: prospectiveEvaluated,
    prospectiveQuestionsTotal: expectedProspectiveTotal,
    benchmarkIndex,
    isPartialEvaluation: isPartial,
  };
}

function computeBenchmarkIndex(alternativeResults: QuestionResult[]): BenchmarkIndexBreakdown {
  if (alternativeResults.length === 0) {
    return {
      status: "NOT_EVALUATED",
      relationship: "NOT_APPLICABLE",
      score: 0,
      rationale: "No alternatives questions were evaluated.",
    };
  }

  // Check relationship signals on the alternative evaluations
  const hasDefended = alternativeResults.some((r) => r.alternativeRelationship === "DEFENDED");
  if (hasDefended) {
    return {
      status: "ESTABLISHED_BENCHMARK",
      relationship: "DEFENDED",
      score: 100,
      rationale: "Target brand is recognized as the market benchmark and defended over alternatives.",
    };
  }

  const hasBenchmark = alternativeResults.some(
    (r) =>
      r.alternativeRelationship === "BENCHMARK" ||
      (r.posture !== "NOT_MENTIONED" && r.alternativeRelationship !== "DISPLACED")
  );
  const hasDisplaced = alternativeResults.some((r) => r.alternativeRelationship === "DISPLACED");

  if (hasDisplaced && !hasBenchmark) {
    return {
      status: "DISPLACED_INCUMBENT",
      relationship: "DISPLACED",
      score: 40,
      rationale: "Target brand is recognized as an incumbent, but alternatives are actively recommended to replace it.",
    };
  }

  if (hasBenchmark) {
    return {
      status: "ESTABLISHED_BENCHMARK",
      relationship: "BENCHMARK",
      score: 85,
      rationale: "Target brand is recognized as the industry reference benchmark against which competitors are compared.",
    };
  }

  const allNotMentioned = alternativeResults.every((r) => r.posture === "NOT_MENTIONED");
  if (allNotMentioned) {
    return {
      status: "UNRECOGNIZED",
      relationship: "NOT_APPLICABLE",
      score: 0,
      rationale: "Brand was not recognized as a benchmark in alternative evaluations.",
    };
  }

  return {
    status: "RECOGNIZED_ALTERNATIVE",
    relationship: "BENCHMARK",
    score: 60,
    rationale: "Brand is recognized in the alternative ecosystem.",
  };
}
