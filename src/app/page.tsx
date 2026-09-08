export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-800 bg-slate-900/60 text-xs text-slate-400 mb-8">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        Phase 0 Initialized: AI Recommendation Engine
      </div>

      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
        Does AI recommend your business?
      </h1>

      <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
        See whether ChatGPT, Gemini, and other AI systems recommend your business to potential buyers — and find out which competitors they are recommending instead.
      </p>

      <div className="w-full max-w-xl bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            placeholder="https://yourcompany.com"
            disabled
            className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            disabled
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20 disabled:opacity-75 cursor-not-allowed"
          >
            Check my AI visibility
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-3 text-left">
          * Phase 0 architecture initialized. No login required. Live scan pipeline executes in Phase 1.
        </p>
      </div>
    </main>
  );
}
