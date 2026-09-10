import React from "react";
import { CompetitorMention } from "@/types";
import { PostureBadge } from "./PostureBadge";
import { Users2 } from "lucide-react";

interface Props {
  competitors: CompetitorMention[];
}

export const CompetitorTable: React.FC<Props> = ({ competitors }) => {
  if (!competitors || competitors.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center text-sm text-slate-400">
        No competing brands were prominently recommended in this evaluation.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">
      <div className="flex items-center gap-2.5 mb-2">
        <Users2 className="w-5 h-5 text-blue-400" />
        <h2 className="text-xl font-bold text-white tracking-tight">
          Who is AI comparing you with?
        </h2>
      </div>
      <p className="text-sm text-slate-400 mb-6">
        When buyers ask AI for recommendations in your category, these are the alternative solutions AI surfaced.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-xs font-semibold uppercase text-slate-500">
              <th className="pb-3 pl-2">Competitor</th>
              <th className="pb-3 px-4">AI Recommendation Posture</th>
              <th className="pb-3 px-4 text-center">Avg Rank</th>
              <th className="pb-3 pr-2 text-right">Frequency</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {competitors.map((comp, idx) => (
              <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3.5 pl-2 font-medium text-white flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                  {comp.name}
                </td>
                <td className="py-3.5 px-4">
                  <PostureBadge posture={comp.posture} rank={comp.rank} />
                </td>
                <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                  {comp.rank ? `#${comp.rank}` : "?"}
                </td>
                <td className="py-3.5 pr-2 text-right font-mono text-slate-300">
                  {comp.frequency} / 5 questions
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
