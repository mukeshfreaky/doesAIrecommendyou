"use client";

import React, { useState } from "react";
import { QuestionResult } from "@/types";
import { PostureBadge } from "./PostureBadge";
import { ChevronDown, ChevronUp, Globe, Search, ExternalLink, Users, AlertCircle, ShieldCheck } from "lucide-react";

interface Props {
  result: QuestionResult;
  index: number;
}

export const QuestionCard: React.FC<Props> = ({ result, index }) => {
  const [expanded, setExpanded] = useState(false);
  const isEvidenceBacked = result.evidenceStatus === "EVIDENCE_BACKED" || (result.citedSources && result.citedSources.length > 0);
  const isRetrievalFailed = result.evidenceStatus === "RETRIEVAL_FAILED";
  const isEvaluationFailed = result.evidenceStatus === "EVALUATION_FAILED";

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 hover:border-slate-700/80 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              Scenario {index + 1}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-800/80 text-blue-400 border border-slate-700/50">
              {result.category.replace(/_/g, " ")}
            </span>
            {isEvidenceBacked ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                <Globe className="w-3 h-3" /> Checked against live web evidence
              </span>
            ) : isRetrievalFailed ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/50">
                <AlertCircle className="w-3 h-3" /> Live web evidence could not be retrieved for this question.
              </span>
            ) : isEvaluationFailed ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-rose-950/60 text-rose-400 border border-rose-800/50">
                <AlertCircle className="w-3 h-3" /> Evaluator error
              </span>
            ) : (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800/50 text-slate-400">
                AI answered without live web retrieval
              </span>
            )}
          </div>
          <h3 className="text-base font-semibold text-white leading-snug">
            "{result.question}"
          </h3>
          <p className="text-xs text-slate-400 mt-1 italic">
            {result.rationale}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <PostureBadge
            posture={result.posture}
            rank={result.brandRank ?? undefined}
            alternativeRelationship={result.alternativeRelationship}
          />
        </div>
      </div>

      <div className="mt-3 p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 text-sm text-slate-300">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
          AI Posture Evaluation:
        </span>
        {result.recommendationReason}
      </div>

      {result.competitors && result.competitors.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
          <Users className="w-3.5 h-3.5 text-slate-500 inline" />
          <span className="font-medium text-slate-500">Competitors Surfaced:</span>
          {result.competitors.map((comp, i) => (
            <span key={i} className="px-2 py-0.5 rounded bg-slate-800/70 text-slate-300 text-[11px]">
              {comp.name}
            </span>
          ))}
        </div>
      )}

      {/* Claims backed by evidence */}
      {result.claims && result.claims.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Evidence-Backed Claims:
          </span>
          <ul className="space-y-1">
            {result.claims.map((claimItem, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                <span className="text-emerald-400 font-mono text-[11px] shrink-0">✔</span>
                <span>
                  {claimItem.claim}
                  <span className="text-slate-500 font-mono text-[10px] ml-1.5">
                    [{claimItem.evidenceIds.join(", ")}]
                  </span>
                </span>
              </li>
            ))}
          </ul>
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
              {isEvidenceBacked || result.citedSources.length > 0
                ? `View Raw Evidence & AI Evaluation (${result.citedSources.length} sources)`
                : `View Raw AI Response`}{" "}
              <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-slate-800 pt-4">
          {/* Retrieved Evidence Sources */}
          {result.retrievedEvidence && result.retrievedEvidence.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Retrieved Web Evidence:
              </div>
              <div className="space-y-2">
                {result.retrievedEvidence.map((ev) => (
                  <div key={ev.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono text-emerald-400 font-medium">[{ev.id}] {ev.domain}</span>
                      <a
                        href={ev.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline inline-flex items-center gap-1 text-[11px]"
                      >
                        Source <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="text-white font-medium mb-1">{ev.title}</div>
                    <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2">{ev.snippet}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.rawAIResponse && (
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase mb-2">
                Raw AI Evaluator Response:
              </div>
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                {result.rawAIResponse}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
