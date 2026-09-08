"use client";

import React, { useState } from "react";
import { ScanReport } from "@/types";
import { ScoreGauge } from "./ScoreGauge";
import { QuestionCard } from "./QuestionCard";
import { CompetitorTable } from "./CompetitorTable";
import { PrescriptionList } from "./PrescriptionList";
import { CitationList } from "./CitationList";
import {
  Globe,
  Share2,
  Copy,
  Check,
  Cpu,
  Coins,
  Clock,
  Sparkles,
  Layers,
  ArrowLeft,
} from "lucide-react";

interface Props {
  report: ScanReport;
  onReset: () => void;
}

export const ReportView: React.FC<Props> = ({ report, onReset }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Analyze another website
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {report.businessProfile.name}
            </h1>
            <span className="text-sm font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800">
              {report.domain}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Scan completed on {new Date(report.generatedAt).toLocaleString()} ? Model: {report.providerMetadata.modelId} (Grounding with Google Search)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            {copied ? "Link Copied!" : "Share Report"}
          </button>
        </div>
      </div>

      {/* Hero Score Gauge */}
      <ScoreGauge score={report.score} />

      {/* Prescriptive Engine: How to Become More Recommendable */}
      <PrescriptionList items={report.actionItems} />

      {/* 5 Evaluated Buyer Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Evaluated Buyer Questions ({report.questionResults.length})
            </h2>
            <p className="text-sm text-slate-400">
              Neutral, high-intent commercial questions buyers ask AI when choosing solutions.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {report.questionResults.map((result, idx) => (
            <QuestionCard key={result.questionId} result={result} index={idx} />
          ))}
        </div>
      </div>

      {/* Competitors */}
      <CompetitorTable competitors={report.competitors} />

      {/* Citations */}
      <CitationList
        citations={report.questionResults.flatMap((r) => r.citedSources)}
      />

      {/* Crawled Evidence & Transparency Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Business Evidence Extracted */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-xs text-slate-400 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Layers className="w-4 h-4 text-blue-400" />
            Crawled Business Evidence
          </div>
          <div>
            <span className="text-slate-500 font-medium">Pages Crawled:</span>{" "}
            {report.evidence.crawledPagesCount} pages ({report.evidence.sourcePages.join(", ")})
          </div>
          <div>
            <span className="text-slate-500 font-medium">Detected Target Customers:</span>{" "}
            {report.businessProfile.targetCustomers.length > 0
              ? report.businessProfile.targetCustomers.join(", ")
              : "General business buyers"}
          </div>
          <div>
            <span className="text-slate-500 font-medium">Pricing Signals:</span>{" "}
            {report.businessProfile.pricingSignals.length > 0
              ? report.businessProfile.pricingSignals.join("; ")
              : "None detected on crawled pages"}
          </div>
        </div>

        {/* Live Grounding Provider Telemetry */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-xs text-slate-400 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Cpu className="w-4 h-4 text-emerald-400" />
            Live Grounding Telemetry & Audit
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-slate-500 font-medium">Search Queries:</span>{" "}
              {report.providerMetadata.searchQueriesExecuted} executed
            </div>
            <div>
              <span className="text-slate-500 font-medium">Execution Latency:</span>{" "}
              {Math.round(report.providerMetadata.latencyMs / 1000)}s
            </div>
            <div>
              <span className="text-slate-500 font-medium">Input / Output Tokens:</span>{" "}
              {report.providerMetadata.inputTokens} / {report.providerMetadata.outputTokens}
            </div>
            <div>
              <span className="text-slate-500 font-medium">Estimated AI Cost:</span>{" "}
              ${report.providerMetadata.estimatedCostUSD.toFixed(4)} USD
            </div>
          </div>
          <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-800">
            Grounding with Google Search. Zero fabricated responses.
          </p>
        </div>
      </div>
    </div>
  );
};
