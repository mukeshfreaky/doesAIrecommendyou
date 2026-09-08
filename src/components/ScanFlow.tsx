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
} from "lucide-react";

const SCAN_STEPS = [
  "Crawling website & extracting business profile",
  "Generating 5 commercial buyer questions across intent taxonomy",
  "Executing Google Search Grounded evaluation via Gemini",
  "Classifying recommendation postures & competitor mentions",
  "Computing Visibility Score & tactical prescriptions",
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

    // Simulated progress steps during the network request
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev < SCAN_STEPS.length - 1 ? prev + 1 : prev));
    }, 4500);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Scan failed with status ${res.status}`);
      }

      setReport(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred during the scan.";
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
    <div className="w-full max-w-2xl mx-auto text-center space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-900/60 bg-blue-950/40 text-xs font-medium text-blue-400 mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          AI Recommendation Intelligence Platform
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Does AI recommend <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            your business?
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto mt-4 leading-relaxed">
          See whether AI recommends your business for real buyer questions ? starting with Google Gemini. Uncover which competitors win instead and get actionable prescriptions to become more recommendable.
        </p>
      </div>

      {/* Input Box */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-sm">
        <form onSubmit={handleStartScan} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
              placeholder="Enter your website URL (e.g. stripe.com)"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-11 pr-4 py-3.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                Analyze AI Visibility
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
              Executing live intelligence scan...
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
            <div>
              <div className="font-semibold text-rose-200 mb-0.5">Scan Error</div>
              {error.message}
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Server-side API keys only</span>
          </div>
          <div>Live Google Search Grounding ? Zero fabricated AI data</div>
        </div>
      </div>
    </div>
  );
};
