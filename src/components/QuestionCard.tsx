"use client";

import React, { useState } from "react";
import { QuestionResult } from "@/types";
import { PostureBadge } from "./PostureBadge";
import { ChevronDown, ChevronUp, Search, ExternalLink } from "lucide-react";

interface Props {
  result: QuestionResult;
  index: number;
}

export const QuestionCard: React.FC<Props> = ({ result, index }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 hover:border-slate-700 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              Q{index + 1}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-800/80 text-blue-400 border border-slate-700/50">
              {result.category.replace(/_/g, " ")}
            </span>
          </div>
          <h3 className="text-base font-semibold text-white leading-snug">
            "{result.question}"
          </h3>
          <p className="text-xs text-slate-400 mt-1 italic">
            {result.rationale}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <PostureBadge posture={result.posture} rank={result.brandRank} />
        </div>
      </div>

      <div className="mt-3 p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 text-sm text-slate-300">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
          AI Posture Evaluation:
        </span>
        {result.recommendationReason}
      </div>

      {result.searchQueries && result.searchQueries.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
          <Search className="w-3.5 h-3.5 text-slate-500 inline" />
          <span className="font-medium text-slate-500">Grounded Searches:</span>
          {result.searchQueries.map((q, i) => (
            <span key={i} className="px-2 py-0.5 rounded bg-slate-800/70 text-slate-300 font-mono text-[11px]">
              {q}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
        >
          {expanded ? (
            <>
              Hide Raw AI Answer & Evidence <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              View Raw Grounded AI Response ({result.citedSources.length} citations) <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-slate-800 pt-4">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase mb-2">
              Raw AI Provider Response:
            </div>
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-sans text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
              {result.rawAIResponse}
            </div>
          </div>

          {result.citedSources.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase mb-2">
                Grounding Citations Retrieved:
              </div>
              <ul className="space-y-1.5">
                {result.citedSources.map((cite, i) => (
                  <li key={i} className="text-xs flex items-center gap-2">
                    <span className="text-slate-500 font-mono text-[10px]">[{i + 1}]</span>
                    <a
                      href={cite.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline inline-flex items-center gap-1 truncate max-w-lg"
                    >
                      {cite.title || cite.domain} <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                      {cite.category}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
