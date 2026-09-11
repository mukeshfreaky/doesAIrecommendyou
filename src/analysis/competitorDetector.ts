import { CompetitorMention, RecommendationPosture } from "@/types";

const EXCLUDED_ENTITIES = new Set([
  "summary",
  "conclusion",
  "overview",
  "pricing",
  "features",
  "pros",
  "cons",
  "key features",
  "verdict",
  "recommendation",
  "alternatives",
  "options",
  "comparison",
  "table",
  "note",
  "disclaimer",
  "methodology",
  "step",
  "category",
  "tools",
  "software",
  "platform",
  "solution",
]);

export function detectCompetitors(
  aiResponses: Array<{ text: string; citations?: string[] }>,
  targetBrand: string,
  targetDomain?: string
): CompetitorMention[] {
  const competitorMap = new Map<
    string,
    {
      name: string;
      ranks: number[];
      postures: RecommendationPosture[];
      count: number;
      citations: Set<string>;
    }
  >();

  const targetBrandNorm = (targetBrand || "").toLowerCase().trim();
  const targetDomainNorm = (targetDomain || "").toLowerCase().replace(/^www\./, "").trim();

  for (const { text, citations = [] } of aiResponses) {
    if (!text || typeof text !== "string") continue;

    let textToScan = text;
    // Check if text is JSON and extract recommendationReason
    if (text.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(text.trim());
        if (typeof parsed.recommendationReason === "string") {
          textToScan = `${parsed.recommendationReason}\n${text}`;
        }
      } catch {
        // Not JSON, continue scanning text directly
      }
    }

    const lines = textToScan.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    let listRank = 0;

    for (const line of lines) {
      // Look for numbered or bulleted bold names: e.g. "1. **CompetitorName**" or "- **CompetitorName**:"
      const boldMatch = line.match(/(?:^\d+[.)]\s+|^[\-*]\s+)?\*\*([A-Za-z0-9\s\-.&]{2,30})\*\*/);
      const numberMatch = line.match(/^(\d+)[.)]\s+([A-Za-z0-9\s\-.&]{2,30})(?::|-|\s)/);

      let candidateName: string | null = null;
      let detectedRank: number | undefined = undefined;

      if (boldMatch) {
        candidateName = boldMatch[1].trim();
      } else if (numberMatch) {
        candidateName = numberMatch[2].trim();
        detectedRank = parseInt(numberMatch[1], 10);
      }

      if (line.match(/^\d+[.)]/)) {
        listRank++;
        if (!detectedRank) detectedRank = listRank;
      }

      if (!candidateName) continue;

      const norm = candidateName.toLowerCase();

      // Exclude target brand itself
      if (
        norm === targetBrandNorm ||
        targetBrandNorm.includes(norm) ||
        norm.includes(targetBrandNorm) ||
        norm === targetDomainNorm ||
        targetDomainNorm.includes(norm)
      ) {
        continue;
      }

      // Exclude generic terms
      if (EXCLUDED_ENTITIES.has(norm) || candidateName.length < 2 || candidateName.length > 35) {
        continue;
      }

      const posture: RecommendationPosture =
        detectedRank === 1
          ? "TOP_RECOMMENDATION"
          : detectedRank && detectedRank <= 3
          ? "RECOMMENDED"
          : "CONSIDERED";

      const existing = competitorMap.get(norm);
      if (existing) {
        existing.count++;
        if (detectedRank) existing.ranks.push(detectedRank);
        existing.postures.push(posture);
        citations.forEach((c) => existing.citations.add(c));
      } else {
        competitorMap.set(norm, {
          name: candidateName,
          ranks: detectedRank ? [detectedRank] : [],
          postures: [posture],
          count: 1,
          citations: new Set(citations),
        });
      }
    }
  }

  // Convert map to sorted CompetitorMention array
  const results: CompetitorMention[] = [];

  for (const item of competitorMap.values()) {
    const avgRank =
      item.ranks.length > 0
        ? Math.round(item.ranks.reduce((a, b) => a + b, 0) / item.ranks.length)
        : undefined;

    // Posture is highest attained posture
    const posture: RecommendationPosture = item.postures.includes("TOP_RECOMMENDATION")
      ? "TOP_RECOMMENDATION"
      : item.postures.includes("RECOMMENDED")
      ? "RECOMMENDED"
      : "CONSIDERED";

    results.push({
      name: item.name,
      rank: avgRank,
      posture,
      frequency: item.count,
      supportingCitations: Array.from(item.citations).slice(0, 3),
    });
  }

  // Sort by frequency descending, then rank ascending
  results.sort((a, b) => {
    if (b.frequency !== a.frequency) return b.frequency - a.frequency;
    return (a.rank || 99) - (b.rank || 99);
  });

  return results.slice(0, 8);
}
