import React from "react";
import { ActionItem } from "@/types";
import {
  CheckCircle2,
  Zap,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface Props {
  items: ActionItem[];
}

export const PrescriptionList: React.FC<Props> = ({ items }) => {
  if (!items || items.length === 0) {
    return null;
  }

  const getPriorityBadge = (priority: ActionItem["priority"], index: number) => {
    switch (priority) {
      case "HIGH":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-950 text-rose-300 border border-rose-800/80">
            Priority #{index + 1} • High Impact
          </span>
        );
      case "MEDIUM":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950 text-amber-300 border border-amber-800/80">
            Priority #{index + 1} • Medium Impact
          </span>
        );
      case "LOW":
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
            Priority #{index + 1}
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6 md:p-8">
      <div className="flex items-center gap-2.5 mb-2">
        <Zap className="w-5 h-5 text-amber-400" />
        <h2 className="text-xl font-bold text-zinc-100 tracking-tight">
          What to Fix (3 Prioritized Actions)
        </h2>
      </div>
      <p className="text-sm text-zinc-400 mb-6">
        Concrete improvements to help AI assistants recognize your strengths, compare your solution accurately, and recommend your business to buyers.
      </p>

      <div className="grid grid-cols-1 gap-5">
        {items.map((item, idx) => (
          <div
            key={item.id || idx}
            className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 hover:border-zinc-700/80 transition-colors space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/60 pb-3">
              <div className="flex items-center gap-2">
                {getPriorityBadge(item.priority, idx)}
                <span className="text-xs font-mono text-zinc-400 px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">
                  {item.category.replace(/_/g, " ")}
                </span>
              </div>
            </div>

            <h3 className="text-base font-semibold text-zinc-100 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
              <span>{item.title}</span>
            </h3>

            <div className="grid grid-cols-1 gap-3 text-xs">
              {/* 1. Problem */}
              <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800/80">
                <div className="font-semibold text-rose-300 flex items-center gap-1.5 mb-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> Problem:
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  {item.problem || item.description}
                </p>
              </div>

              {/* 2. Why it matters for AI recommendation visibility */}
              <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800/80">
                <div className="font-semibold text-amber-300 flex items-center gap-1.5 mb-1">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" /> Why it matters for AI recommendation visibility:
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  {item.whyItMatters || item.rationale}
                </p>
              </div>

              {/* 3. Suggested improvement */}
              <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800/80">
                <div className="font-semibold text-emerald-300 flex items-center gap-1.5 mb-1">
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" /> Suggested improvement:
                </div>
                <p className="text-zinc-200 leading-relaxed">
                  {item.suggestedImprovement || `${item.title} — update web positioning and documentation to explicitly answer buyer comparison queries.`}
                </p>
              </div>

              {/* 4. Evidence supporting the recommendation */}
              <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800/80">
                <div className="font-semibold text-blue-300 flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Evidence supporting this recommendation:
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  {item.supportingEvidence || item.expectedImpact}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

