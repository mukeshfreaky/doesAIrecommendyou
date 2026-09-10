import { AlternativeRelationship, IntentCategory, RecommendationPosture } from "@/types";

export interface PostureAnalysisResult {
  posture: RecommendationPosture;
  brandRank?: number;
  recommendationReason: string;
  supportingEvidence: string[];
  alternativeRelationship?: AlternativeRelationship;
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

const DISPLACED_SIGNALS = [
  /\b(?:drawback|limitation|flaw|weakness|lacks|missing|expensive|unreliable|outgrown|switch away|switch from|reasons to leave|reasons to switch|migrate away)\b/i,
  /\b(?:better than|superior to|preferred over|replaces?|upgrade from)\b/i,
  /\b(?:struggles with|falls short|cannot handle|is not ideal for)\b/i,
];

const DEFENDED_SIGNALS = [
  /\b(?:stick with|remain with|still recommend|hard to beat|best choice remains)\b/i,
  /\b(?:remains the best|is still superior|is hard to replace|is still the top choice|holds its own)\b/i,
  /\b(?:no need to switch|unnecessary to switch)\b/i,
];

export function classifyPosture(
  brandName: string,
  domain: string,
  aiResponse: string,
  questionIntent?: IntentCategory
): PostureAnalysisResult {
  if (!aiResponse || !aiResponse.trim()) {
    return {
      posture: "NOT_MENTIONED",
      recommendationReason: "AI response was empty.",
      supportingEvidence: [],
      alternativeRelationship: "NOT_APPLICABLE",
    };
  }

  const cleanBrand = brandName.trim();
  const cleanDomain = domain.replace(/^www\./, "").trim();

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
      alternativeRelationship: "NOT_APPLICABLE",
    };
  }

  // Extract sentences mentioning brand
  const sentences = aiResponse
    .split(/(?<=[.!?\n])\s+/)
    .filter((s) => brandRegex.test(s) || domainRegex.test(s));

  const supportingEvidence = sentences.slice(0, 3).map((s) => s.trim());
  const combinedContext = sentences.join(" ");

  // Determine list rank if response has numbered or bulleted items
  const { rank, isFirstInList } = detectListRank(aiResponse, cleanBrand, cleanDomain);

  // Check if this is an ALTERNATIVES / competitor query
  const isAlternativesQuery =
    questionIntent === "ALTERNATIVES" ||
    questionIntent === "COMPETITOR_COMPARISON" ||
    questionIntent === "SWITCHING";

  if (isAlternativesQuery) {
    const hasDisplacedSignal = DISPLACED_SIGNALS.some((regex) => regex.test(combinedContext));
    const hasDefendedSignal = DEFENDED_SIGNALS.some((regex) => regex.test(combinedContext));

    if (hasDisplacedSignal && !hasDefendedSignal) {
      return {
        posture: "MENTIONED",
        brandRank: undefined,
        recommendationReason: `${cleanBrand} is referenced as an incumbent, but alternatives are actively recommended to replace it.`,
        supportingEvidence,
        alternativeRelationship: "DISPLACED",
      };
    }

    if (hasDefendedSignal) {
      return {
        posture: "CONSIDERED",
        brandRank: rank,
        recommendationReason: `${cleanBrand} was evaluated against alternatives, with the AI defending its ongoing positioning.`,
        supportingEvidence,
        alternativeRelationship: "DEFENDED",
      };
    }

    // Default for alternatives: Target brand is the reference benchmark
    // Never award TOP_RECOMMENDATION or RECOMMENDED on alternatives
    return {
      posture: "CONSIDERED",
      brandRank: rank && rank > 1 ? rank : undefined,
      recommendationReason: `${cleanBrand} is recognized as the established reference benchmark against which alternatives are evaluated.`,
      supportingEvidence,
      alternativeRelationship: "BENCHMARK",
    };
  }

  // Non-alternatives queries: Standard commercial buyer postures
  const isTopBySignal = TOP_SIGNALS.some(
    (regex) => regex.test(combinedContext) || (isFirstInList && regex.test(aiResponse.slice(0, 300)))
  );

  if (isTopBySignal || rank === 1) {
    return {
      posture: "TOP_RECOMMENDATION",
      brandRank: 1,
      recommendationReason: `${cleanBrand} is surfaced as a primary #1 recommendation for this buyer query.`,
      supportingEvidence,
      alternativeRelationship: "NOT_APPLICABLE",
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
      alternativeRelationship: "NOT_APPLICABLE",
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
      alternativeRelationship: "NOT_APPLICABLE",
    };
  }

  // If mentioned without recommendation sentiment
  return {
    posture: "MENTIONED",
    brandRank: rank,
    recommendationReason: `${cleanBrand} was referenced in passing, but not actively recommended.`,
    supportingEvidence,
    alternativeRelationship: "NOT_APPLICABLE",
  };
}

function extractEntityNameFromListItem(itemContent: string): string {
  // If markdown bolding: e.g. **SendGrid** or **SendGrid:**
  const boldMatch = itemContent.match(/^\*\*([^*]+)\*\*/);
  if (boldMatch) {
    return boldMatch[1].trim();
  }

  // If delimited by colon, hyphen, dash, paren, or pipe
  const delimMatch = itemContent.match(
    /^([^:\-–—(|]+?)(?:[:\-–—(]|\s+is\b|\s+provides\b|\s+offers\b)/i
  );
  if (delimMatch) {
    return delimMatch[1].trim();
  }

  // Otherwise first 4 words
  return itemContent.trim().split(/\s+/).slice(0, 4).join(" ");
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
      const entityName = extractEntityNameFromListItem(itemText);
      if (brandRegex.test(entityName) || domainRegex.test(entityName)) {
        detectedRank = numberedIndex;
        if (numberedIndex === 1) {
          isFirst = true;
        }
        break;
      }
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      numberedIndex++;
      const itemText = line.replace(/^[-*]\s+/, "");
      const entityName = extractEntityNameFromListItem(itemText);
      if (brandRegex.test(entityName) || domainRegex.test(entityName)) {
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
