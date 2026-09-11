"use client";

import React, { useState } from "react";
import { ScanReport } from "@/types";
import { ReportView } from "./ReportView";
import {
  Search,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Globe2,
  TrendingUp,
  BarChart3,
  ExternalLink,
} from "lucide-react";

const SCAN_STEPS = [
  "Extracting business profile & category signals...",
  "Generating realistic buyer intent queries...",
  "Retrieving live web search evidence...",
  "Evaluating competitive recommendation share...",
  "Formulating diagnostic report & action plan...",
];

export const ScanFlow: React.FC = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [report, setReport] = useState<ScanReport | null>(null);

  const handleStartScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);
    setActiveStep(0);

    // Progressive step indicator during scanning
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev < SCAN_STEPS.length - 1 ? prev + 1 : prev));
    }, 3800);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Unable to complete scan. (Status: ${res.status})`);
      }

      setReport(data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "We encountered an issue analyzing this website. Please check the URL and try again.";
      setError({ message: msg });
    } finally {
      clearInterval(stepInterval);
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setReport(null);
    setError(null);
    setUrl("");
  };

  if (report) {
    return <ReportView report={report} onReset={handleReset} />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-16 animate-in fade-in duration-300">
      {/* 1. HERO: Editorial, Authoritative Business Intelligence Header */}
      <div className="text-center space-y-4 pt-4">
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
          Does AI recommend your business?
        </h1>

        <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          See which buyer questions surface your business — and which competitors AI recommends instead.
        </p>
      </div>

      {/* 2. DIAGNOSTIC INPUT CONSOLE */}
      <div className="max-w-2xl mx-auto space-y-3">
        <div className="bg-zinc-950 border border-zinc-800/90 rounded-xl p-2.5 sm:p-3 shadow-lg">
          <form onSubmit={handleStartScan} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading}
                placeholder="Enter website (e.g. resend.com or stripe.com)"
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg pl-10 pr-3 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors disabled:opacity-50 font-mono text-xs sm:text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-3 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running diagnostic...
                </>
              ) : (
                <>
                  Run free scan
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Progress / Step Telemetry */}
          {isLoading && (
            <div className="mt-4 pt-4 border-t border-zinc-800/80 text-left space-y-2.5 px-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                Live Diagnostic Execution
              </div>
              {SCAN_STEPS.map((step, idx) => {
                const isDone = idx < activeStep;
                const isCurrent = idx === activeStep;
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-2.5 text-xs font-mono transition-opacity duration-200 ${
                      isCurrent
                        ? "text-blue-400 font-medium"
                        : isDone
                        ? "text-zinc-500"
                        : "text-zinc-700"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : isCurrent ? (
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin shrink-0" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-zinc-800 shrink-0" />
                    )}
                    <span>
                      0{idx + 1} / {step}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="mt-3 p-3.5 rounded-lg bg-rose-950/40 border border-rose-900/60 text-left flex items-start gap-2.5 text-rose-300 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-rose-200 mb-0.5">Diagnostic Error</div>
                <p className="text-rose-300/90">{error.message}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-rose-400 hover:underline flex items-center gap-1 font-medium text-[11px]"
                >
                  <RefreshCw className="w-3 h-3" /> Try another domain
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Input Metadata & Trust Signal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-[11px] text-zinc-500">
          <div className="font-mono">
            5 buyer scenarios · Live web evidence · Competitor comparison
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
            <span>Private diagnostic · Snapshot evaluation</span>
          </div>
        </div>
      </div>

      {/* 3. DIAGNOSTIC METHODOLOGY */}
      <div className="border-t border-zinc-800/80 pt-10">
        <div className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 text-center mb-8">
          Diagnostic Methodology
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-5 rounded-xl border border-zinc-800/70 bg-zinc-950/40 space-y-2">
            <div className="text-xs font-mono text-zinc-500 font-semibold">01 / Extraction</div>
            <h3 className="text-sm font-semibold text-zinc-200">Understand your business</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Extracts your core products, services, target audience, and commercial category directly from public pages.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-zinc-800/70 bg-zinc-950/40 space-y-2">
            <div className="text-xs font-mono text-zinc-500 font-semibold">02 / Simulation</div>
            <h3 className="text-sm font-semibold text-zinc-200">Test realistic buyer queries</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Evaluates realistic buyer scenarios (discovery, best-of, alternatives, and use cases) against live search results.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-zinc-800/70 bg-zinc-950/40 space-y-2">
            <div className="text-xs font-mono text-zinc-500 font-semibold">03 / Competitive Analysis</div>
            <h3 className="text-sm font-semibold text-zinc-200">Measure recommendations & fixes</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Identifies which competitors win recommendation share, why they win, and 3 prioritized actions to take.
            </p>
          </div>
        </div>
      </div>

      {/* 4. SAMPLE DIAGNOSTIC PREVIEW (Product Preview Mockup) */}
      <div className="border-t border-zinc-800/80 pt-10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 mb-1">
              Sample Report Output
            </div>
            <h3 className="text-base font-semibold text-white">
              What your diagnostic report reveals
            </h3>
          </div>
          <p className="text-xs text-zinc-500">
            Based on realistic commercial search queries & live web evidence
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-6 space-y-6 shadow-xl text-left">
          {/* Mockup Header: Score */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                AI Recommendation Visibility
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white font-mono">72</span>
                <span className="text-sm font-medium text-zinc-500">/ 100</span>
                <span className="ml-2 text-xs font-medium text-blue-400 px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/60">
                  Strong Recommendation Visibility
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                AI actively recommended the business in 3 of 4 buyer scenarios evaluated.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 border-t sm:border-t-0 sm:border-l border-zinc-800 pt-3 sm:pt-0 sm:pl-6">
              <div>
                <div className="text-lg font-bold text-emerald-400">25%</div>
                <div className="text-[10px] text-zinc-500">Top Pick (#1)</div>
              </div>
              <div className="border-l border-zinc-800 pl-4">
                <div className="text-lg font-bold text-blue-400">75%</div>
                <div className="text-[10px] text-zinc-500">Recommended</div>
              </div>
              <div className="border-l border-zinc-800 pl-4">
                <div className="text-lg font-bold text-amber-400">100%</div>
                <div className="text-[10px] text-zinc-500">Considered</div>
              </div>
            </div>
          </div>

          {/* Mockup Split: Where brand won vs competitors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800/60 space-y-2">
              <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Where AI Recommends You
              </div>
              <ul className="space-y-1 text-zinc-300 text-[11px] leading-relaxed">
                <li>• Recommended as top choice for developer DX and fast API integration.</li>
                <li>• Selected as leading modern alternative for React email templates.</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800/60 space-y-2">
              <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Where Competitors Lead
              </div>
              <ul className="space-y-1 text-zinc-300 text-[11px] leading-relaxed">
                <li>• High-volume legacy enterprise queries favored Postmark and SendGrid.</li>
                <li>• Dedicated IP warmup and SMTP relay standard queries favored incumbents.</li>
              </ul>
            </div>
          </div>

          {/* Mockup Action Item */}
          <div className="p-4 rounded-lg bg-zinc-900/30 border border-zinc-800/50 space-y-2 text-xs">
            <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider flex items-center justify-between">
              <span>Prioritized Fix #1 (High Impact)</span>
              <span className="text-zinc-500">Content Gap</span>
            </div>
            <div className="text-sm font-semibold text-white">
              Publish direct comparison and migration guide vs. Postmark
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Postmark appeared across 3 buyer queries. Publishing an objective tradeoff page enables AI models to identify use cases where your solution is preferred.
            </p>
          </div>

          <div className="text-[11px] text-zinc-500 italic text-center pt-1 border-t border-zinc-800/60">
            * Sample preview for illustration. Entering your website runs a live, evidence-grounded diagnostic scan for your exact business.
          </div>
        </div>
      </div>
    </div>
  );
};

