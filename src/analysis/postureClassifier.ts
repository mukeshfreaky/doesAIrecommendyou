import { RecommendationPosture } from "@/types";

export interface PostureAnalysisResult {
  posture: RecommendationPosture;
  brandRank?: number;
  recommendationReason: string;
  supportingEvidence: string[];
}

const TOP_SIGNALS = [
  /top recommendation/i,
  /top pick/i,
  /best overall/i,
  /first choice/i,
  /leading platform/i,
  /clear winner/i,
  /our highest recommendation/i,
  /number one/i,
  /#1/i,
];

const RECOMMEND_SIGNALS = [
  /highly recommend/i,
  /strongly recommend/i,
  /excellent choice/i,
  /standout/i,
  /great option/i,
  /top choice/i,
  /well-suited/i,
  /ideal for/i,
  /recommended for/i,
];

const CONSIDER_SIGNALS = [
  /also consider/i,
  /worth considering/i,
  /other options include/i,
  /alternatives include/i,
  /can also look at/i,
  /viable alternative/i,
  /another option/i,
];

export function classifyPosture(
  brandName: string,
  domain: string,
  aiResponse: string
): PostureAnalysisResult {
  if (!aiResponse || !aiResponse.trim()) {
    return {
      posture: "NOT_MENTIONED",
      recommendationReason: "AI response was empty.",
      supportingEvidence: [],
    };
  }

  const cleanBrand = brandName.trim();
  const cleanDomain = domain.replace(/^www\./, "").trim();
  const lowerText = aiResponse.toLowerCase();

  // Check if brand or domain exists in text (handling case insensitivity and word boundaries)
  const brandRegex = new RegExp(`\\b${escapeRegex(cleanBrand)}\\b`, "i");
  const domainRegex = new RegExp(escapeRegex(cleanDomain), "i");

  const brandMatches = brandRegex.test(aiResponse);
  const domainMatches = domainRegex.test(aiResponse);

  if (!brandMatches && !domainMatches) {
    return {
      posture: "NOT_MENTIONED",
      recommendationReason: `Neither ${cleanBrand} nor ${cleanDomain} was cited or recommended in the AI response.`,
      supportingEvidence: [],
    };
  }

  // Extract sentences mentioning brand
  const sentences = aiResponse
    .split(/(?<=[.!?\n])\s+/)
    .filter((s) => brandRegex.test(s) || domainRegex.test(s));

  const supportingEvidence = sentences.slice(0, 3).map((s) => s.trim());

  // Determine list rank if response has numbered or bulleted items
  const { rank, isFirstInList } = detectListRank(aiResponse, cleanBrand, cleanDomain);

  // Check top signals
  const combinedContext = sentences.join(" ");
  const isTopBySignal = TOP_SIGNALS.some(
    (regex) => regex.test(combinedContext) || (isFirstInList && regex.test(aiResponse.slice(0, 300)))
  );

  if (isTopBySignal || rank === 1) {
    return {
      posture: "TOP_RECOMMENDATION",
      brandRank: 1,
      recommendationReason: `${cleanBrand} is surfaced as a primary #1 recommendation for this buyer query.`,
      supportingEvidence,
    };
  }

  // Check recommended signals
  const isRecommended =
    RECOMMEND_SIGNALS.some((regex) => regex.test(combinedContext)) ||
    (rank !== undefined && rank <= 3);

  if (isRecommended) {
    return {
      posture: "RECOMMENDED",
      brandRank: rank,
      recommendationReason: `${cleanBrand} is recommended as a strong contender with positive endorsement.`,
      supportingEvidence,
    };
  }

  // Check considered signals
  const isConsidered =
    CONSIDER_SIGNALS.some((regex) => regex.test(combinedContext)) ||
    (rank !== undefined && rank > 3) ||
    /alternative|option/i.test(combinedContext);

  if (isConsidered) {
    return {
      posture: "CONSIDERED",
      brandRank: rank,
      recommendationReason: `${cleanBrand} is presented neutrally as an available option or alternative.`,
      supportingEvidence,
    };
  }

  // If mentioned without recommendation sentiment
  return {
    posture: "MENTIONED",
    brandRank: rank,
    recommendationReason: `${cleanBrand} was referenced in passing, but not actively recommended.`,
    supportingEvidence,
  };
}

function detectListRank(
  text: string,
  brand: string,
  domain: string
): { rank?: number; isFirstInList: boolean } {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const brandRegex = new RegExp(`\\b${escapeRegex(brand)}\\b`, "i");
  const domainRegex = new RegExp(escapeRegex(domain), "i");

  let numberedIndex = 0;
  let detectedRank: number | undefined = undefined;
  let isFirst = false;

  for (const line of lines) {
    const numberMatch = line.match(/^(\d+)[.)]\s+(.+)/);
    if (numberMatch) {
      numberedIndex++;
      const itemText = numberMatch[2];
      if (brandRegex.test(itemText) || domainRegex.test(itemText)) {
        detectedRank = numberedIndex;
        if (numberedIndex === 1) {
          isFirst = true;
        }
        break;
      }
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      numberedIndex++;
      if (brandRegex.test(line) || domainRegex.test(line)) {
        detectedRank = numberedIndex;
        if (numberedIndex === 1) {
          isFirst = true;
        }
        break;
      }
    }
  }

  return { rank: detectedRank, isFirstInList: isFirst };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
