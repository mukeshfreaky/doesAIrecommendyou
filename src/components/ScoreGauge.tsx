import React from "react";
import { VisibilityScoreBreakdown } from "@/types";
import { Award, AlertTriangle, HelpCircle, CheckCircle2, ShieldAlert } from "lucide-react";

interface Props {
  score: VisibilityScoreBreakdown;
}

export const ScoreGauge: React.FC<Props> = ({ score }) => {
  const {
    overallScore,
    recommendationRate,
    topRecommendationRate,
    considerationRate,
    prospectiveQuestionsEvaluated = 0,
    prospectiveQuestionsTotal = 4,
    isPartialEvaluation,
    benchmarkIndex,
  } = score;

  const getTier = (s: number) => {
    if (s >= 80)
      return {
        label: "Dominant AI Recommendation",
        color: "text-emerald-400",
        border: "border-emerald-500/30",
        bg: "bg-emerald-950/20",
        summary:
          "AI consistently selects your business as a top choice when prospective customers ask for solutions in your category.",
      };
    if (s >= 55)
      return {
        label: "Strong Recommendation Visibility",
        color: "text-blue-400",
        border: "border-blue-500/30",
        bg: "bg-blue-950/20",
        summary:
          "AI actively recommends your business across key buyer scenarios, alongside leading category competitors.",
      };
    if (s >= 30)
      return {
        label: "Moderate Visibility",
        color: "text-amber-400",
        border: "border-amber-500/30",
        bg: "bg-amber-950/20",
        summary:
          "AI considers your business for specific use cases, but primarily recommends established category leaders.",
      };
    if (s > 0)
      return {
        label: "Low Visibility",
        color: "text-orange-400",
        border: "border-orange-500/30",
        bg: "bg-orange-950/20",
        summary:
          "AI rarely surfaces your business as a primary recommendation, favoring category competitors.",
      };
    return {
      label: "Zero Recommendation Visibility",
      color: "text-slate-300",
      border: "border-slate-700/80",
      bg: "bg-slate-900/60",
      summary:
        "AI isn't currently surfacing your business as a primary recommendation for these buyer questions. Category competitors were recommended instead.",
    };
  };

  const hasProspectiveEvaluations = prospectiveQuestionsEvaluated > 0;
  const tier = getTier(overallScore);

  // Exact scenario counts derived strictly from computed rates
  const recommendedScenarios = Math.round((recommendationRate / 100) * prospectiveQuestionsEvaluated);
  const topScenarios = Math.round((topRecommendationRate / 100) * prospectiveQuestionsEvaluated);

  const getBenchmarkBadge = () => {
    if (!benchmarkIndex || benchmarkIndex.status === "NOT_EVALUATED") {
      return {
        label: "Not evaluated",
        color: "text-slate-400 bg-slate-800/80 border-slate-700",
        desc: "No alternatives queries were evaluated in this scan.",
      };
    }
    switch (benchmarkIndex.relationship) {
      case "DEFENDED":
        return {
          label: "Recognized Benchmark — AI Defended",
          color: "text-emerald-400 bg-emerald-950/60 border-emerald-800/80",
          desc: "AI recognizes your business as the market benchmark and actively defended choosing it over alternatives.",
        };
      case "DISPLACED":
        return {
          label: "Incumbent Facing Displacement",
          color: "text-rose-400 bg-rose-950/60 border-rose-800/80",
          desc: "AI is aware of your business as an incumbent, but actively recommends competitor alternatives to replace it.",
        };
      case "BENCHMARK":
      default:
        return {
          label: "Recognized Market Benchmark",
          color: "text-blue-400 bg-blue-950/60 border-blue-800/80",
          desc: "AI recognizes your business as an established reference standard when buyers compare alternative solutions.",
        };
    }
  };

  const benchmarkBadge = getBenchmarkBadge();

  return (
    <div className="space-y-6">
      {/* Main Answer Card */}
      <div className={`relative overflow-hidden rounded-2xl border ${tier.border} bg-slate-900/90 p-6 sm:p-8 backdrop-blur-md shadow-2xl space-y-6`}>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Diagnostic Answer
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            AI Recommendation Visibility
          </h2>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-2">
          {/* Primary Score Counter */}
          <div className="space-y-2 max-w-xl">
            <div className="flex items-baseline gap-3">
              {hasProspectiveEvaluations ? (
                <>
                  <span className="text-6xl sm:text-7xl font-black tracking-tight text-white">
                    {overallScore}
                  </span>
                  <span className="text-xl font-medium text-slate-500">/ 100</span>
                </>
              ) : (
                <div className="text-2xl font-bold text-slate-400">
                  Evaluation Unavailable
                </div>
              )}
            </div>

            {hasProspectiveEvaluations ? (
              <div className={`text-sm font-semibold ${tier.color} flex items-center gap-2`}>
                <span className="inline-block w-2 h-2 rounded-full bg-current" />
                {tier.label}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Insufficient completed buyer scenarios to compute a recommendation score.
              </p>
            )}

            {/* Plain English Explanation of Score */}
            {hasProspectiveEvaluations && (
              <div className="space-y-1 pt-1">
                <p className="text-sm text-slate-300 font-medium">
                  {overallScore === 0 ? (
                    <span>
                      AI recommended competitors across all{" "}
                      <span className="text-white font-bold">{prospectiveQuestionsEvaluated}</span> buyer scenarios evaluated.
                    </span>
                  ) : (
                    <span>
                      AI recommended your business in{" "}
                      <span className="text-white font-bold">{recommendedScenarios} of {prospectiveQuestionsEvaluated}</span>{" "}
                      buyer scenarios evaluated.
                      {topScenarios > 0 && (
                        <span className="text-emerald-400 font-normal block sm:inline sm:ml-1">
                          (Top choice in {topScenarios} scenario{topScenarios > 1 ? "s" : ""})
                        </span>
                      )}
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {tier.summary}
                </p>
              </div>
            )}

            {isPartialEvaluation && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-amber-950/60 text-amber-300 border border-amber-800/60 mt-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Based on {prospectiveQuestionsEvaluated} of {prospectiveQuestionsTotal} buyer scenarios ({prospectiveQuestionsTotal - prospectiveQuestionsEvaluated} question{prospectiveQuestionsTotal - prospectiveQuestionsEvaluated > 1 ? "s" : ""} could not be retrieved; missing questions do not reduce your score).
                </span>
              </div>
            )}
          </div>

          {/* Prospective Scenario Rates Breakdown */}
          {hasProspectiveEvaluations && (
            <div className="grid grid-cols-3 gap-4 w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-8">
              <div className="text-center md:text-left">
                <div className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono">
                  {topRecommendationRate}%
                </div>
                <div className="text-xs text-slate-400 mt-1 leading-tight">
                  Top Choice (#1)
                </div>
              </div>

              <div className="text-center md:text-left border-x border-slate-800 px-3 md:px-4">
                <div className="text-2xl sm:text-3xl font-bold text-blue-400 font-mono">
                  {recommendationRate}%
                </div>
                <div className="text-xs text-slate-400 mt-1 leading-tight">
                  Recommended
                </div>
              </div>

              <div className="text-center md:text-left">
                <div className="text-2xl sm:text-3xl font-bold text-amber-400 font-mono">
                  {considerationRate}%
                </div>
                <div className="text-xs text-slate-400 mt-1 leading-tight">
                  Considered
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Competitive Benchmark Signal (Experimental - Kept strictly separate) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-7 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                Competitive Benchmark Signal <span className="text-[10px] text-purple-400 font-normal border border-purple-800/60 rounded px-1.5 py-0.5 ml-1">Experimental</span>
              </h3>
            </div>
            <p className="text-xs text-slate-400 max-w-xl">
              Experimental signal observing how AI positions your brand when prospective buyers search for competitor alternatives.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${benchmarkBadge.color}`}>
              {benchmarkBadge.label}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
          <p>{benchmarkBadge.desc}</p>
          <span className="text-[11px] text-slate-500 shrink-0 italic">
            * Benchmark signal measures competitive reference presence, not a purchase recommendation.
          </span>
        </div>
      </div>
    </div>
  );
};
