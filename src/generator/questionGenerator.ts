import { BusinessProfile, BuyerQuestion, IntentCategory } from "@/types";

/**
 * Sanitizes untrusted crawled content to prevent prompt injection and garbage input.
 */
export function sanitizeEvidenceText(input: string): string {
  if (!input) return "";
  return input
    .replace(/[<>{}\[\]`$\\]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 300)
    .trim();
}

/**
 * Generates 5 neutral, non-leading, realistic commercial buyer questions
 * spanning distinct categories from the 11-intent taxonomy.
 */
export function generateBuyerQuestions(profile: BusinessProfile): BuyerQuestion[] {
  const categoryTerm = determineCategoryTerm(profile);
  const targetAudience = determineTargetAudience(profile);
  const primaryIndustry = profile.industries[0] || "modern businesses";
  const primaryFeature = determinePrimaryFeature(profile);
  const primaryUseCase = profile.useCases[0] || `managing ${categoryTerm.toLowerCase()}`;

  const candidates: Array<{
    category: IntentCategory;
    question: string;
    rationale: string;
  }> = [
    // 1. Category Discovery
    {
      category: "CATEGORY_DISCOVERY",
      question: `What are the best ${categoryTerm} solutions for ${targetAudience}?`,
      rationale: `Evaluates if AI surfaces your brand when target buyers ask for general category recommendations.`,
    },
    // 2. Best-Of Commercial Intent
    {
      category: "BEST_OF",
      question: `What is the top-rated ${categoryTerm} platform right now?`,
      rationale: `Tests AI top-of-mind posture for high-intent queries looking for the market leader.`,
    },
    // 3. Use Case Specific
    {
      category: "USE_CASE",
      question: `What tools are recommended for ${sanitizeEvidenceText(primaryUseCase)}?`,
      rationale: `Tests if AI recognizes your specific functional strengths and problem-solving capability.`,
    },
    // 4. Industry / Company Size Context
    {
      category: profile.industries.length > 0 ? "INDUSTRY" : "COMPANY_SIZE",
      question: profile.industries.length > 0
        ? `What are the leading ${categoryTerm} platforms designed for ${primaryIndustry}?`
        : `What are the best ${categoryTerm} tools for ${targetAudience}?`,
      rationale: `Measures vertical industry relevance and domain-specific recommendation posture.`,
    },
    // 5. Price / Value or Feature Specific
    {
      category: primaryFeature ? "FEATURE_SPECIFIC" : "PRICE_VALUE",
      question: primaryFeature
        ? `Which ${categoryTerm} software offers the best ${sanitizeEvidenceText(primaryFeature)}?`
        : `What are the most cost-effective ${categoryTerm} tools with transparent pricing?`,
      rationale: `Tests differentiation on specific capabilities or value-driven buyer evaluations.`,
    },
  ];

  // Guarantee exactly 5 items with unique IDs
  return candidates.slice(0, 5).map((item, index) => ({
    id: `q_${index + 1}_${item.category.toLowerCase()}`,
    category: item.category,
    question: item.question,
    rationale: item.rationale,
  }));
}

function determineCategoryTerm(profile: BusinessProfile): string {
  if (profile.productsOrServices.length > 0) {
    const candidate = sanitizeEvidenceText(profile.productsOrServices[0]);
    if (candidate.length > 3 && candidate.length < 35) {
      return candidate;
    }
  }

  // Derive from description
  const desc = profile.description.toLowerCase();
  const match = desc.match(/(?:platform for|software for|tool for|solution for|provider of)\s+([a-z0-9\s\-]{3,30})/i);
  if (match && match[1]) {
    return sanitizeEvidenceText(match[1].trim());
  }

  return "software";
}

function determineTargetAudience(profile: BusinessProfile): string {
  if (profile.targetCustomers.length > 0) {
    const candidate = sanitizeEvidenceText(profile.targetCustomers[0]);
    if (candidate.length > 2 && candidate.length < 30) {
      return candidate;
    }
  }
  return "teams and growing businesses";
}

function determinePrimaryFeature(profile: BusinessProfile): string | null {
  if (profile.keyFeatures.length > 0) {
    const candidate = sanitizeEvidenceText(profile.keyFeatures[0]);
    if (candidate.length > 3 && candidate.length < 40) {
      return candidate;
    }
  }
  if (profile.differentiators.length > 0) {
    const candidate = sanitizeEvidenceText(profile.differentiators[0]);
    if (candidate.length > 3 && candidate.length < 40) {
      return candidate;
    }
  }
  return null;
}
