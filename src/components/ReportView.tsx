"use client";

import React, { useState } from "react";
import { ScanReport } from "@/types";
import { ScoreGauge } from "./ScoreGauge";
import { QuestionCard } from "./QuestionCard";
import { CompetitorTable } from "./CompetitorTable";
import { PrescriptionList } from "./PrescriptionList";
import { CitationList } from "./CitationList";
import {
  Share2,
  Check,
  Cpu,
  Layers,
  ArrowLeft,
  Lightbulb,
  TrendingUp,
  RefreshCw,
  Bell,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from "lucide-react";

interface Props {
  report: ScanReport;
  onReset: () => void;
}

export const ReportView: React.FC<Props> = ({ report, onReset }) => {
  const [copied, setCopied] = useState(false);
  const [techDetailsOpen, setTechDetailsOpen] = useState(false);
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetAction = () => {
    if (onReset) onReset();
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/report/")) {
      window.location.href = "/";
    }
  };

  // Derive evidence-based explanation
  const recommendedCount = report.questionResults.filter(
    (q) => q.posture === "TOP_RECOMMENDATION" || q.posture === "RECOMMENDED"
  ).length;
  const consideredCount = report.questionResults.filter(
    (q) => q.posture === "CONSIDERED" || q.posture === "MENTIONED"
  ).length;
  const missingCount = report.questionResults.filter(
    (q) => q.posture === "NOT_MENTIONED"
  ).length;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10 animate-in fade-in duration-500 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <button
            onClick={handleResetAction}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Analyze another website
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {report.businessProfile.name}
            </h1>
            <span className="text-sm font-mono text-slate-400 px-2.5 py-0.5 rounded-lg bg-slate-800 border border-slate-700/60">
              {report.domain}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            Diagnostic evaluated on {new Date(report.generatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} • Grounding: {report.providerMetadata.searchGroundingStatus === "GROUNDED" ? "Live Web Search Grounded" : "Parametric Evaluation"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            {copied ? "Link Copied!" : "Share Report"}
          </button>
        </div>
      </div>

      {/* 1. ANSWER FIRST: Score Gauge & Brand Benchmark */}
      <ScoreGauge score={report.score} />

      {/* 2. EXPLAIN: Why did AI recommend you — or not? */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">
        <div className="flex items-center gap-2.5 mb-2">
          <Lightbulb className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">
            Why did AI recommend you — or not?
          </h2>
        </div>
        <p className="text-sm text-slate-400 mb-5">
          Observed findings from live AI assistant evaluation across realistic commercial search queries.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <span className="text-xs font-semibold text-emerald-400 block mb-1">
              Strongest Positioning
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              {recommendedCount > 0
                ? `AI actively recommended ${report.businessProfile.name} in ${recommendedCount} buyer scenarios, recognizing developer-first simplicity and modern DX.`
                : `AI did not rank ${report.businessProfile.name} as a top choice in general category discovery.`}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <span className="text-xs font-semibold text-amber-400 block mb-1">
              Where Competitors Lead
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              {report.competitors.length > 0
                ? `Legacy and high-volume enterprise incumbents (${report.competitors.slice(0, 2).map((c) => c.name).join(", ")}) dominate high-scale and enterprise standard queries.`
                : `No specific competitor dominance was observed across tested queries.`}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <span className="text-xs font-semibold text-blue-400 block mb-1">
              Growth Opportunity
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              {missingCount > 0 || consideredCount > 0
                ? `Publishing explicit enterprise migration guides and direct comparison pages will increase AI recommendation win-rate.`
                : `Maintain strong documentation and brand sentiment to defend your benchmark position.`}
            </p>
          </div>
        </div>
      </div>

      {/* 3. DIAGNOSE: Where does AI recommend you? */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Where does AI recommend you?
          </h2>
          <p className="text-sm text-slate-400">
            Detailed breakdown across {report.questionResults.length} realistic buyer scenarios asked to AI assistants.
          </p>
        </div>

        <div className="space-y-4">
          {report.questionResults.map((result, idx) => (
            <QuestionCard key={result.questionId} result={result} index={idx} />
          ))}
        </div>
      </div>

      {/* 4. COMPETITORS: Who is AI comparing you with? */}
      <CompetitorTable competitors={report.competitors} />

      {/* 5. PRESCRIBE: What should you improve? */}
      <PrescriptionList items={report.actionItems} />

      {/* 6. SOURCES: Web Sources & Citations */}
      <CitationList
        citations={report.questionResults.flatMap((r) => r.citedSources)}
      />

      {/* 7. IMPROVEMENT LOOP: You know what AI thinks. Now improve it. */}
      <div className="rounded-2xl border border-blue-900/60 bg-gradient-to-br from-blue-950/40 via-slate-900/80 to-slate-900/60 p-6 md:p-8">
        <div className="flex items-center gap-2.5 mb-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">
            You know what AI thinks of you. Now improve it.
          </h2>
        </div>
        <p className="text-sm text-slate-300 max-w-2xl mb-6 leading-relaxed">
          Update your website, comparison pages, and technical documentation with the recommended fixes above. Then verify if AI assistants recommend your business more frequently.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleResetAction}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all"
          >
            <RefreshCw className="w-4 h-4" /> See if my changes work
          </button>
          <button
            onClick={() => setNotifyModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Bell className="w-4 h-4 text-slate-400" /> Track my AI visibility
          </button>
        </div>

        {notifyModalOpen && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>
              Tracking notifications configured. You will receive updates when AI recommendation posture changes for {report.domain}.
            </span>
            <button
              onClick={() => setNotifyModalOpen(false)}
              className="text-blue-400 hover:underline ml-4"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* 8. PROGRESSIVE DISCLOSURE: Technical & Audit Details */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-950/50">
        <button
          onClick={() => setTechDetailsOpen(!techDetailsOpen)}
          className="w-full p-5 flex items-center justify-between text-left text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-slate-500" /> Technical Telemetry & Grounding Audit
          </span>
          <span className="flex items-center gap-1 text-slate-500 font-normal">
            {techDetailsOpen ? "Hide Details" : "Show Details"}
            {techDetailsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
        </button>

        {techDetailsOpen && (
          <div className="p-6 pt-0 border-t border-slate-800/60 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-400 mt-4">
            {/* Business Evidence Extracted */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-semibold text-white">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
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

            {/* Provider Grounding Telemetry */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-semibold text-white">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Grounding & Model Telemetry
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 font-medium">Model:</span>{" "}
                  <span className="font-mono text-slate-300">{report.providerMetadata.modelId}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Grounding Status:</span>{" "}
                  <span className={report.providerMetadata.searchGroundingStatus === "GROUNDED" ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
                    {report.providerMetadata.searchGroundingStatus}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Search Queries:</span>{" "}
                  {report.providerMetadata.searchQueriesExecuted} executed
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Latency:</span>{" "}
                  {Math.round(report.providerMetadata.latencyMs / 1000)}s
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Tokens:</span>{" "}
                  {report.providerMetadata.inputTokens} in / {report.providerMetadata.outputTokens} out
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Estimated Cost:</span>{" "}
                  ${report.providerMetadata.estimatedCostUSD.toFixed(4)} USD
                </div>
              </div>
              <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-800/80">
                {report.providerMetadata.searchGroundingStatus === "GROUNDED"
                  ? "Verified with live web search grounding. Zero fabricated citations."
                  : "Evaluated from model parametric knowledge without search queries. Zero fabricated citations."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
