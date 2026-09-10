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

  const isEvidenceBacked = report.providerMetadata.searchGroundingStatus === "EVIDENCE_BACKED" ||
    report.questionResults.some((q) => q.evidenceStatus === "EVIDENCE_BACKED");

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
            Diagnostic evaluated on {new Date(report.generatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} • {isEvidenceBacked ? "We checked live web evidence and asked AI to evaluate what it shows." : "Parametric Evaluation"}
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
          Observed findings from live web evidence and AI evaluation across realistic commercial search queries.
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
          <p className="text-sm text-slate-400 mt-1">
            Buyer scenarios tested against live web evidence.
          </p>
        </div>

        <div className="space-y-3">
          {report.questionResults.map((result, idx) => (
            <QuestionCard key={result.questionId || idx} result={result} index={idx} />
          ))}
        </div>
      </div>

      {/* 4. BENCHMARK: Competitors Surfaced */}
      <CompetitorTable
        competitors={report.competitors}
      />

      {/* 5. GROUNDING CITATIONS: Real Web Sources */}
      {report.questionResults.some((q) => q.citedSources && q.citedSources.length > 0) && (
        <CitationList
          citations={report.questionResults.flatMap((q) => q.citedSources)}
        />
      )}

      {/* 6. PRESCRIBE: Action Items to Win AI Recommendations */}
      <PrescriptionList items={report.actionItems} />

      {/* 7. RE-CHECK CADENCE & RETENTION HOOK */}
      <div className="rounded-2xl border border-blue-900/40 bg-gradient-to-br from-blue-950/40 to-indigo-950/20 p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
            <RefreshCw className="w-4 h-4" /> Recommended Re-audit Cadence
          </div>
          <h3 className="text-lg font-bold text-white">
            AI rankings change continuously as new web reviews are indexed.
          </h3>
          <p className="text-xs text-slate-400 max-w-xl">
            Track whether your search visibility improves after publishing new comparison pages or migration guides.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          <button
            onClick={() => setNotifyModalOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/20"
          >
            <Bell className="w-3.5 h-3.5" /> Re-check in 30 Days
          </button>
        </div>
      </div>

      {/* Re-check modal simulated notification */}
      {notifyModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Re-audit Reminder</h4>
                <p className="text-xs text-slate-400">Bookmark this diagnostic report</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              We recommend re-running this scan in 30 days after implementing the recommended comparison pages. Save this report URL to track your benchmark score progress over time.
            </p>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 truncate max-w-[260px]">
                {typeof window !== "undefined" ? window.location.href : ""}
              </span>
              <button
                onClick={handleCopyLink}
                className="text-xs text-blue-400 hover:underline shrink-0"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setNotifyModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Progressive Disclosure: Crawl & Telemetry */}
      <div className="border border-slate-800/80 rounded-2xl bg-slate-950/40 overflow-hidden">
        <button
          onClick={() => setTechDetailsOpen(!techDetailsOpen)}
          className="w-full px-6 py-4 flex items-center justify-between text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-500" />
            Technical Telemetry & Crawl Provenance
          </span>
          {techDetailsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {techDetailsOpen && (
          <div className="px-6 pb-6 pt-2 border-t border-slate-800/80 space-y-4 text-xs text-slate-400">
            {/* Business Profile Metadata */}
            <div className="space-y-1.5">
              <div className="font-semibold text-white">Extracted Business Profile:</div>
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

            {/* Provider & Retrieval Telemetry */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-semibold text-white">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Dedicated Retrieval & Evaluator Telemetry (Architecture C)
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 font-medium">Retrieval Provider:</span>{" "}
                  <span className="font-mono text-slate-300">{report.providerMetadata.retrievalProvider || "Tavily Search API"}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Evaluator Model:</span>{" "}
                  <span className="font-mono text-slate-300">{report.providerMetadata.modelId}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Evidence Status:</span>{" "}
                  <span className={isEvidenceBacked ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
                    {report.providerMetadata.searchGroundingStatus}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Retrieval Searches:</span>{" "}
                  {report.providerMetadata.retrievalQueriesExecuted || report.questions.length} queries
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Native Gemini Search:</span>{" "}
                  <span className="text-slate-300 font-mono">0 (Disabled)</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Latency:</span>{" "}
                  {Math.round(report.providerMetadata.latencyMs / 1000)}s
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Tokens:</span>{" "}
                  {report.providerMetadata.inputTokens || 0} in / {report.providerMetadata.outputTokens || 0} out
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Estimated Cost:</span>{" "}
                  ${(report.providerMetadata.estimatedCostUSD || 0).toFixed(4)} USD
                </div>
              </div>
              <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-800/80">
                {isEvidenceBacked
                  ? "We checked live web evidence and asked AI to evaluate what it shows. Zero native search calls, zero fabricated citations."
                  : "Evaluated from model parametric knowledge. Zero fabricated citations."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
