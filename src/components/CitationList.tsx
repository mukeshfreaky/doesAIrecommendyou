import React from "react";
import { Citation } from "@/types";
import { Globe, CheckCircle2, ExternalLink } from "lucide-react";

interface Props {
  citations: Citation[];
}

export const CitationList: React.FC<Props> = ({ citations }) => {
  if (!citations || citations.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">
      <div className="flex items-center gap-2.5 mb-2">
        <Globe className="w-5 h-5 text-purple-400" />
        <h2 className="text-xl font-bold text-white tracking-tight">
          Web Sources & Grounding Citations
        </h2>
      </div>
      <p className="text-sm text-slate-400 mb-6">
        Live web sources retrieved and cited by AI search grounding to formulate buyer recommendations.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {citations.map((cite, idx) => (
          <div
            key={idx}
            className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-medium text-slate-300 truncate">
                  {cite.domain}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase font-mono">
                  {cite.category.replace(/_/g, " ")}
                </span>
              </div>
              <a
                href={cite.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:underline flex items-center gap-1 truncate"
              >
                {cite.title || cite.url}
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>

            <div className="shrink-0 flex flex-col items-end gap-1">
              {cite.supportsBrand ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Brand Cited
                </span>
              ) : (
                <span className="text-[11px] text-slate-500">
                  Third-party
                </span>
              )}
              <span className="text-[10px] text-slate-500 font-mono">
                Cited {cite.frequency}x
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
