import React from "react";
import { AlternativeRelationship, RecommendationPosture } from "@/types";

interface Props {
  posture: RecommendationPosture;
  rank?: number;
  alternativeRelationship?: AlternativeRelationship;
}

export const PostureBadge: React.FC<Props> = ({ posture, rank, alternativeRelationship }) => {
  // If this is an ALTERNATIVES result with a specific relationship, display appropriate benchmark badge
  if (alternativeRelationship && alternativeRelationship !== "NOT_APPLICABLE") {
    switch (alternativeRelationship) {
      case "DEFENDED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            AI defended brand
          </span>
        );
      case "DISPLACED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-950/80 text-rose-400 border border-rose-800/80 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            AI favored alternatives
          </span>
        );
      case "BENCHMARK":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-950/80 text-blue-400 border border-blue-800/80 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Recognized benchmark
          </span>
        );
    }
  }

  switch (posture) {
    case "TOP_RECOMMENDATION":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Top recommendation {rank ? `(#${rank})` : ""}
        </span>
      );
    case "RECOMMENDED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-950/80 text-blue-400 border border-blue-800/80 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          Recommended {rank ? `(#${rank})` : ""}
        </span>
      );
    case "CONSIDERED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-800/80 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Considered {rank ? `(#${rank})` : ""}
        </span>
      );
    case "MENTIONED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800/80 text-slate-300 border border-slate-700 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Mentioned
        </span>
      );
    case "NOT_MENTIONED":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-950/80 text-rose-400 border border-rose-800/80 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          Not mentioned
        </span>
      );
  }
};
