import { getScanReport } from "@/lib/scanStorage";
import { ReportView } from "@/components/ReportView";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = getScanReport(id);

  if (!report) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8">
          <h1 className="text-xl font-bold text-white mb-2">Report Not Found</h1>
          <p className="text-sm text-slate-400 mb-6">
            This scan report is expired or does not exist in memory.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Start a new scan
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-10 px-4 sm:px-8">
      <ReportView report={report} onReset={() => {}} />
    </main>
  );
}
