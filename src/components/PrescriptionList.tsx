import React from "react";
import { ActionItem } from "@/types";
import { CheckCircle2, Zap, AlertCircle, HelpCircle, ArrowRight } from "lucide-react";

interface Props {
  items: ActionItem[];
}

export const PrescriptionList: React.FC<Props> = ({ items }) => {
  if (!items || items.length === 0) {
    return null;
  }

  const getPriorityBadge = (priority: ActionItem["priority"]) => {
    switch (priority) {
      case "HIGH":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-950 text-rose-400 border border-rose-800/80">
            High Priority
          </span>
        );
      case "MEDIUM":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950 text-amber-400 border border-amber-800/80">
            Medium Priority
          </span>
        );
      case "LOW":
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300">
            Low Priority
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">
      <div className="flex items-center gap-2.5 mb-2">
        <Zap className="w-5 h-5 text-amber-400" />
        <h2 className="text-xl font-bold text-white tracking-tight">
          What should you improve?
        </h2>
      </div>
      <p className="text-sm text-slate-400 mb-6">
        Concrete steps to improve how AI assistants perceive, rank, and recommend your business.
      </p>

      <div className="grid grid-cols-1 gap-5">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-slate-800 bg-slate-950/70 p-5 hover:border-slate-700/80 transition-colors"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                {getPriorityBadge(item.priority)}
                <span className="text-xs font-mono text-slate-400">
                  {item.category.replace(/_/g, " ")}
                </span>
              </div>
            </div>

            <h3 className="text-base font-semibold text-white mb-3 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400 mt-1 shrink-0" />
              <span>{item.title}</span>
            </h3>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <span className="font-semibold text-rose-400 shrink-0 w-28 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Problem:
                </span>
                <span className="text-slate-300">{item.description}</span>
              </div>

              {item.rationale && (
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-amber-400 shrink-0 w-28 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5" /> Why it matters:
                  </span>
                  <span className="text-slate-400">{item.rationale}</span>
                </div>
              )}

              <div className="flex items-start gap-2">
                <span className="font-semibold text-emerald-400 shrink-0 w-28 flex items-center gap-1">
                  <ArrowRight className="w-3.5 h-3.5" /> Suggested action:
                </span>
                <span className="text-slate-200">{item.title} — update web positioning and documentation to explicitly answer buyer comparison queries.</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <div>
                <span className="text-slate-500 font-medium">Expected AI Impact:</span>{" "}
                <span className="text-slate-300">{item.expectedImpact}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
