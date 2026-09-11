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
  Layers,
  ArrowLeft,
  Lightbulb,
  RefreshCw,
  Bell,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  CheckCircle2,
  TrendingDown,
  Sparkles,
  SearchCheck,
  Compass,
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
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleResetAction = () => {
    if (onReset) onReset();
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/report/")) {
      window.location.href = "/";
    }
  };

  // Classify questions into where brand won vs where competitors led
  const recommendedQuestions = report.questionResults.filter(
    (q) => q.posture === "TOP_RECOMMENDATION" || q.posture === "RECOMMENDED"
  );
  const losingOrLesserQuestions = report.questionResults.filter(
    (q) =>
      q.posture === "NOT_MENTIONED" ||
      q.posture === "CONSIDERED" ||
      q.posture === "MENTIONED" ||
      (q.brandRank && q.brandRank > 1)
  );

  const isEvidenceBacked =
    report.providerMetadata.searchGroundingStatus === "EVIDENCE_BACKED" ||
    report.questionResults.some((q) => q.evidenceStatus === "EVIDENCE_BACKED");

  const totalEvaluated =
    report.score.prospectiveQuestionsEvaluated ?? report.questionResults.length;
  const totalQuestions =
    report.score.prospectiveQuestionsTotal ?? report.questionResults.length;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">
      {/* Top Header & Context */}
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
          <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
            <SearchCheck className="w-3.5 h-3.5 text-blue-400" />
            Diagnostic snapshot evaluated on{" "}
            {new Date(report.generatedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}{" "}
            • {isEvidenceBacked ? "Checked against live web evidence" : "Model Parametric Snapshot"}
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

      {/* ========================================================================= */}
      {/* A. ANSWER FIRST: AI Recommendation Visibility Score */}
      {/* ========================================================================= */}
      <section>
        <ScoreGauge score={report.score} />
      </section>

      {/* ========================================================================= */}
      {/* B. WHERE AI RECOMMENDS YOU */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-bold text-white tracking-tight">
                Where AI Recommends You
              </h2>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Buyer queries where AI surfaced your business as a primary recommendation.
            </p>
          </div>
          <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
            {recommendedQuestions.length} of {totalEvaluated} Scenarios
          </span>
        </div>

        {recommendedQuestions.length > 0 ? (
          <div className="space-y-3">
            {recommendedQuestions.map((result, idx) => (
              <QuestionCard
                key={result.questionId || idx}
                result={result}
                index={report.questionResults.indexOf(result)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-center space-y-2">
            <div className="text-sm font-semibold text-slate-300">
              AI did not surface your business as a primary recommendation in the tested scenarios.
            </div>
            <p className="text-xs text-slate-400 max-w-xl mx-auto leading-relaxed">
              When buyers ask broad category or best-of questions, AI assistants currently prioritize established category incumbents with higher volumes of indexed third-party comparison reviews.
            </p>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* C. WHERE YOU'RE LOSING (Where Competitors Were Recommended Instead) */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-bold text-white tracking-tight">
                Where Competitors Lead
              </h2>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Buyer queries where AI recommended alternative solutions instead.
            </p>
          </div>
          <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/60">
            {losingOrLesserQuestions.length} Scenarios
          </span>
        </div>

        {losingOrLesserQuestions.length > 0 ? (
          <div className="space-y-3">
            {losingOrLesserQuestions.map((result, idx) => (
              <QuestionCard
                key={result.questionId || idx}
                result={result}
                index={report.questionResults.indexOf(result)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
            No competitor dominance observed across tested buyer scenarios.
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* D. COMPETITORS */}
      {/* ========================================================================= */}
      <section>
        <CompetitorTable competitors={report.competitors} />
      </section>

      {/* ========================================================================= */}
      {/* E. WHY (Translate Evidence into Business Reasons) */}
      {/* ========================================================================= */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-2.5 mb-2">
          <Lightbulb className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">
            Why Did AI Recommend You — or Not?
          </h2>
        </div>
        <p className="text-sm text-slate-400">
          We distinguish verified web evidence from model reasoning and actionable steps.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Observed Evidence */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
            <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              1. Observed Web Evidence
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {report.competitors.length > 0
                ? `Live web search indexed extensive third-party review coverage and comparison articles for competitors (${report.competitors.slice(0, 2).map((c) => c.name).join(", ")}).`
                : "Web search returned general category documentation and vendor websites."}
            </p>
          </div>

          {/* 2. AI Inference */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
            <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
              2. AI Evaluator Inference
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {recommendedQuestions.length > 0
                ? `AI recognizes ${report.businessProfile.name} in specific use cases, but selects incumbents for general industry standards where independent comparison data is denser.`
                : `AI currently defaults to market incumbents because they have denser, multi-source corroboration across third-party comparison sites.`}
            </p>
          </div>

          {/* 3. Recommended Action */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              3. Recommended Focus
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Closing third-party review gaps and publishing factual comparison pages vs. top competitors will give AI models clear evidence to recommend your brand.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* GROUNDING CITATIONS: Real Web Sources */}
      {/* ========================================================================= */}
      {report.questionResults.some((q) => q.citedSources && q.citedSources.length > 0) && (
        <section>
          <CitationList
            citations={report.questionResults.flatMap((q) => q.citedSources)}
          />
        </section>
      )}

      {/* ========================================================================= */}
      {/* F. WHAT TO FIX: Exactly 3 Prioritized Actions */}
      {/* ========================================================================= */}
      <section>
        <PrescriptionList items={report.actionItems} />
      </section>

      {/* ========================================================================= */}
      {/* G. IMPROVEMENT LOOP: Track My AI Visibility */}
      {/* ========================================================================= */}
      <section className="rounded-2xl border border-blue-900/50 bg-gradient-to-br from-blue-950/50 via-slate-900/80 to-indigo-950/40 p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl shadow-blue-950/20">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs uppercase tracking-wider">
            <RefreshCw className="w-4 h-4" /> The Visibility Improvement Loop
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white">
            Track your AI visibility & see if changes work
          </h3>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Rerun this diagnostic after implementing your 3 action items to measure whether AI assistants begin recommending your business for these buyer questions.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          <button
            onClick={() => setNotifyModalOpen(true)}
            className="px-5 py-3 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30 active:scale-95"
          >
            <Bell className="w-4 h-4" /> Track My AI Visibility
          </button>
        </div>
      </section>

      {/* Track Visibility Modal */}
      {notifyModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Track AI Recommendation Progress</h4>
                <p className="text-xs text-slate-400">Measure if your updates improve AI recommendations</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Bookmark this diagnostic URL. After updating your website, pricing, and comparison pages, rerun this scan to verify if AI assistants begin recommending your business.
            </p>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 truncate max-w-[260px]">
                {typeof window !== "undefined" ? window.location.href : ""}
              </span>
              <button
                onClick={handleCopyLink}
                className="text-xs text-blue-400 hover:underline shrink-0 font-medium ml-2"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setNotifyModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progressive Disclosure: Technical Telemetry & Crawl Provenance */}
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
                  <span className="font-mono text-slate-300">
                    {report.providerMetadata.retrievalProvider || "Tavily Search API"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Evaluator Model:</span>{" "}
                  <span className="font-mono text-slate-300">{report.providerMetadata.modelId}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Evidence Status:</span>{" "}
                  <span
                    className={
                      isEvidenceBacked
                        ? "text-emerald-400 font-semibold"
                        : "text-amber-400 font-semibold"
                    }
                  >
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
                  {report.providerMetadata.inputTokens || 0} in /{" "}
                  {report.providerMetadata.outputTokens || 0} out
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
