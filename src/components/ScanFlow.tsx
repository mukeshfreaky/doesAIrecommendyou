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
  Sparkles,
  SearchCode,
  HelpCircle,
  Award,
  RefreshCw,
} from "lucide-react";

const SCAN_STEPS = [
  "Understanding your business...",
  "Asking the questions your customers might ask...",
  "Checking what AI recommends...",
  "Comparing the results...",
  "Building your report...",
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
    <div className="w-full max-w-3xl mx-auto space-y-12">
      {/* Hero Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-900/60 bg-blue-950/40 text-xs font-medium text-blue-400">
          <Sparkles className="w-3.5 h-3.5" />
          AI Recommendation Diagnostic
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Does AI recommend <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            your business?
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto leading-relaxed">
          See how AI assistants recommend your business when customers ask what to buy.
        </p>
      </div>

      {/* Input Box */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-sm">
        <form onSubmit={handleStartScan} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
              placeholder="Enter your website (e.g. stripe.com)"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-11 pr-4 py-3.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                Check my business
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Scanning Steps Indicator */}
        {isLoading && (
          <div className="mt-6 pt-6 border-t border-slate-800 text-left space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
              Diagnosing AI recommendation visibility...
            </div>
            {SCAN_STEPS.map((step, idx) => {
              const isDone = idx < activeStep;
              const isCurrent = idx === activeStep;
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-2.5 text-xs transition-opacity duration-300 ${
                    isCurrent
                      ? "text-blue-400 font-semibold"
                      : isDone
                      ? "text-slate-400"
                      : "text-slate-600"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400 shrink-0" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0" />
                  )}
                  <span>{step}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mt-4 p-4 rounded-xl bg-rose-950/50 border border-rose-800/80 text-left flex items-start gap-3 text-rose-300 text-xs leading-relaxed">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-rose-200 mb-0.5">Could not complete scan</div>
              <p className="text-rose-300/90">{error.message}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-rose-400 hover:underline flex items-center gap-1 font-medium"
              >
                <RefreshCw className="w-3 h-3" /> Try another website
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Private diagnostic — no cookies or tracking required</span>
          </div>
          <div>Real-time web search verification</div>
        </div>
      </div>

      {/* How it works: 3-step explanation */}
      <div className="pt-6 border-t border-slate-800/80">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 text-center mb-6">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <div className="p-5 rounded-xl border border-slate-800/80 bg-slate-900/40 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-blue-950/80 border border-blue-800/60 flex items-center justify-center text-blue-400 font-semibold text-xs mb-3">
              1
            </div>
            <h3 className="text-sm font-semibold text-white">Understand your business</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We analyze your products, core services, audience, and market category directly from your website.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-slate-800/80 bg-slate-900/40 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400 font-semibold text-xs mb-3">
              2
            </div>
            <h3 className="text-sm font-semibold text-white">Ask realistic buyer questions</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We simulate the exact questions potential buyers ask AI assistants when actively evaluating solutions.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-slate-800/80 bg-slate-900/40 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-400 font-semibold text-xs mb-3">
              3
            </div>
            <h3 className="text-sm font-semibold text-white">Show what AI recommends</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Discover where you get recommended, which competitors win instead, and specific actions to improve.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
