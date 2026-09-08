import React from "react";
import { VisibilityScoreBreakdown } from "@/types";

interface Props {
  score: VisibilityScoreBreakdown;
}

export const ScoreGauge: React.FC<Props> = ({ score }) => {
  const { overallScore, recommendationRate, topRecommendationRate, considerationRate } = score;

  const getTier = (s: number) => {
    if (s >= 80) return { label: "Dominant Recommendation", color: "text-emerald-400", border: "border-emerald-500/30" };
    if (s >= 55) return { label: "Strong Visibility", color: "text-blue-400", border: "border-blue-500/30" };
    if (s >= 30) return { label: "Moderate Visibility", color: "text-amber-400", border: "border-amber-500/30" };
    if (s > 0) return { label: "Low Visibility", color: "text-orange-400", border: "border-orange-500/30" };
    return { label: "Zero Recommendation Visibility", color: "text-rose-400", border: "border-rose-500/30" };
  };

  const tier = getTier(overallScore);

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${tier.border} bg-slate-900/90 p-6 md:p-8 backdrop-blur-md shadow-2xl`}>
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Recommendation Visibility Score
          </div>
          <div className="flex items-baseline justify-center md:justify-start gap-3">
            <span className="text-6xl md:text-7xl font-black tracking-tight text-white">
              {overallScore}
            </span>
            <span className="text-xl font-medium text-slate-500">/ 100</span>
          </div>
          <div className={`mt-2 text-sm font-semibold ${tier.color} flex items-center justify-center md:justify-start gap-2`}>
            <span className="inline-block w-2 h-2 rounded-full bg-current" />
            {tier.label}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-8">
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-emerald-400">
              {topRecommendationRate}%
            </div>
            <div className="text-xs text-slate-400 mt-1 leading-tight">
              Top Choice (#1)
            </div>
          </div>

          <div className="text-center border-x border-slate-800 px-3">
            <div className="text-2xl md:text-3xl font-bold text-blue-400">
              {recommendationRate}%
            </div>
            <div className="text-xs text-slate-400 mt-1 leading-tight">
              Recommended
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-amber-400">
              {considerationRate}%
            </div>
            <div className="text-xs text-slate-400 mt-1 leading-tight">
              Considered
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
