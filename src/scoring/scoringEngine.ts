import { QuestionResult, VisibilityScoreBreakdown } from "@/types";

/**
 * Calculates the statistically sound Visibility Score Breakdown based on the audited formula:
 * S = 100 * (0.50 * R_rec + 0.35 * R_top + 0.15 * R_cons)
 */
export function calculateVisibilityScore(
  results: QuestionResult[]
): VisibilityScoreBreakdown {
  const total = results.length;
  if (total === 0) {
    return {
      overallScore: 0,
      recommendationRate: 0,
      topRecommendationRate: 0,
      considerationRate: 0,
            supportingCitationCount: 0,
      totalQuestionsEvaluated: 0,
    };
  }

  let topCount = 0;
  let recCount = 0;
  let consCount = 0;
  let supportingCitationCount = 0;

  for (const r of results) {
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

    supportingCitationCount += r.citedSources.filter((c) => c.supportsBrand).length;
  }

  const topRate = topCount / total;
  const recRate = recCount / total;
  const consRate = consCount / total;

  // Single-provider audited formula
  const rawScore = 100 * (0.50 * recRate + 0.35 * topRate + 0.15 * consRate);
  const overallScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  return {
    overallScore,
    recommendationRate: Math.round(recRate * 100),
    topRecommendationRate: Math.round(topRate * 100),
    considerationRate: Math.round(consRate * 100),
        supportingCitationCount,
    totalQuestionsEvaluated: total,
  };
}
