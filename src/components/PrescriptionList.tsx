import React from "react";
import { ActionItem } from "@/types";
import { CheckCircle2, ArrowUpRight, Zap } from "lucide-react";

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
          How to Become More Recommendable
        </h2>
      </div>
      <p className="text-sm text-slate-400 mb-6">
        Concrete tactical prescriptions to improve your standing in search-grounded AI recommendations.
      </p>

      <div className="grid grid-cols-1 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-slate-800 bg-slate-950/70 p-5 hover:border-slate-700 transition-colors"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                {getPriorityBadge(item.priority)}
                <span className="text-xs font-mono text-slate-500">
                  {item.category.replace(/_/g, " ")}
                </span>
              </div>
            </div>

            <h3 className="text-base font-semibold text-white mb-2 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
              <span>{item.title}</span>
            </h3>

            <p className="text-sm text-slate-300 mb-3 leading-relaxed">
              {item.description}
            </p>

            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-400">
              <div>
                <span className="text-slate-500 font-medium">Impact:</span> {item.expectedImpact}
              </div>
              <div className="text-slate-500 italic">
                {item.rationale}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
