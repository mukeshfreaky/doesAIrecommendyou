import {
  ActionItem,
  BusinessProfile,
  Citation,
  CompetitorMention,
  QuestionResult,
  VisibilityScoreBreakdown,
} from "@/types";

export function generateActionableRecommendations(
  score: VisibilityScoreBreakdown,
  questionResults: QuestionResult[],
  competitors: CompetitorMention[],
  citations: Citation[],
  profile: BusinessProfile
): ActionItem[] {
  const candidates: ActionItem[] = [];

  const isLowScore = score.overallScore < 40;
  const reviewCitations = citations.filter((c) => c.category === "REVIEW_SITE");
  const brandReviewCitations = reviewCitations.filter((c) => c.supportsBrand);
  const editorialCitations = citations.filter(
    (c) => c.category === "EDITORIAL_COMPARISON" || c.category === "DIRECTORY"
  );
  const brandEditorialCitations = editorialCitations.filter((c) => c.supportsBrand);

  // 1. Third-Party Review & Authority Presence
  if (brandReviewCitations.length === 0) {
    const topDomains = Array.from(new Set(reviewCitations.map((c) => c.domain))).slice(0, 3);
    const domainList =
      topDomains.length > 0
        ? topDomains.join(", ")
        : profile.archetype === "ECOMMERCE_CONSUMER"
        ? "Trustpilot, Wirecutter, or Reddit"
        : profile.archetype === "TRAVEL_HOSPITALITY"
        ? "Tripadvisor, Google Reviews, or Conde Nast"
        : "G2, Capterra, or TrustRadius";

    candidates.push({
      id: "rec_citations",
      category: "CITATION_SOURCE",
      priority: "HIGH",
      title: "Establish verified profiles on key category review platforms",
      description: `AI search engines relied heavily on independent directories (${domainList}) during retrieval, but found no verified profile or user sentiment data for ${profile.name}.`,
      problem: `No presence on key third-party comparison and review platforms (${domainList}) that AI search engines retrieve for buyer queries.`,
      whyItMatters:
        "AI retrieval engines prioritize independent, third-party aggregators to verify commercial quality, reputation, and customer sentiment before recommending a brand.",
      suggestedImprovement: `Claim and verify your business profile on ${domainList}, encourage authentic user reviews, and ensure key features and pricing are accurately cataloged.`,
      supportingEvidence:
        reviewCitations.length > 0
          ? `Search retrieval referenced ${reviewCitations.length} review site sources that listed competitors but omitted ${profile.name}.`
          : "Web search grounding prioritized third-party aggregated directories over single-vendor marketing claims.",
      expectedImpact:
        "Provides trusted corroborating evidence for search-grounded AI engines evaluating category authority.",
    });
  }

  // 2. Competitor Differentiation & Comparison Coverage
  if (competitors.length > 0) {
    const topCompetitors = competitors.slice(0, 2);
    const competitorNames = topCompetitors.map((c) => c.name).join(" and ");
    const topComp = topCompetitors[0];

    candidates.push({
      id: "rec_differentiation",
      category: "COMPETITOR_DIFFERENTIATION",
      priority: isLowScore ? "HIGH" : "MEDIUM",
      title: `Publish direct comparison and migration guides vs. ${competitorNames}`,
      description: `${competitorNames} appeared in ${topComp.frequency} buyer queries. Creating factual, balanced comparison pages clarifies your distinct advantages when AI evaluates alternatives.`,
      problem: `Competitors (${competitorNames}) dominate category queries because web search indexes existing comparison articles and alternatives guides that highlight them.`,
      whyItMatters:
        "When buyers ask AI for alternatives or comparisons, AI models cite structured comparison tables, feature matrices, and explicit tradeoff analyses.",
      suggestedImprovement: `Publish dedicated '/vs/${topComp.name.toLowerCase()}' comparison pages addressing specific tradeoffs, target user personas, and migration pathways.`,
      supportingEvidence: `${topComp.name} was surfaced in ${topComp.frequency} out of ${score.totalQuestionsEvaluated || 5} evaluated buyer scenarios as a primary recommendation.`,
      expectedImpact:
        "Enables AI models to identify specific use cases and tradeoffs where your brand is preferable over incumbents.",
    });
  }

  // 3. Pricing & Value Transparency
  if (profile.pricingSignals.length === 0) {
    candidates.push({
      id: "rec_pricing",
      category: "CONTENT_GAP",
      priority: "HIGH",
      title: "Publish transparent pricing tiers or starting cost details",
      description: `No pricing signals or plan structures were detected during the website crawl. AI engines frequently evaluate cost-benefit tradeoffs when answering commercial queries.`,
      problem:
        "No public pricing tiers, starting costs, or plan structures were detected on your website crawl.",
      whyItMatters:
        "AI models struggle to recommend solutions for budget-conscious or value-seeking queries when pricing is gated behind sales calls or unindexed.",
      suggestedImprovement:
        "Add a public pricing or plans page with clear tier distinctions, entry-level rates, and feature inclusions so crawlers can index your pricing model.",
      supportingEvidence:
        "Website crawl detected 0 pricing signals or public plan tiers across analyzed landing pages.",
      expectedImpact:
        "Helps search crawlers and AI evaluators assess cost-benefit value during budget and ROI buyer queries.",
    });
  }

  // 4. Feature & Use-Case Specific Content
  if (candidates.length < 3 || isLowScore) {
    const archetypeFeatureAdvice =
      profile.archetype === "DEVELOPER_TOOL"
        ? "Publish comprehensive quickstart guides, SDK documentation, and API benchmark data."
        : profile.archetype === "ECOMMERCE_CONSUMER"
        ? "Publish detailed material specs, durability testing data, and care guides."
        : profile.archetype === "TRAVEL_HOSPITALITY"
        ? "Publish neighborhood guides, verified property amenities, and host safety policies."
        : "Publish detailed use-case guides, workflow integration blueprints, and customer case studies.";

    candidates.push({
      id: "rec_use_cases",
      category: "CONTENT_GAP",
      priority: "MEDIUM",
      title: "Publish dedicated use-case and feature documentation pages",
      description: `Create dedicated content answering specific buyer use cases and evaluative attributes in your category.`,
      problem:
        "General marketing copy lacks the granular, technical, or use-case specific answers that AI models match to nuanced buyer queries.",
      whyItMatters:
        "AI recommendations for feature-specific queries (e.g. speed, workflow flexibility, reliability) directly cite in-depth documentation and case studies.",
      suggestedImprovement: archetypeFeatureAdvice,
      supportingEvidence: `AI models favored alternatives with explicit use-case documentation during category and feature evaluations.`,
      expectedImpact:
        "Increases semantic relevance when buyers ask AI specific functional or scenario-based questions.",
    });
  }

  // 5. Structured Semantic Schema Markup
  if (candidates.length < 3) {
    const schemaType =
      profile.archetype === "ECOMMERCE_CONSUMER"
        ? "Product & AggregateRating"
        : profile.archetype === "TRAVEL_HOSPITALITY"
        ? "LodgingBusiness & FAQPage"
        : "SoftwareApplication & Organization";

    candidates.push({
      id: "rec_schema",
      category: "SCHEMA_METADATA",
      priority: "MEDIUM",
      title: `Implement Schema.org ${schemaType} JSON-LD metadata`,
      description: `Embed machine-readable structured JSON-LD data describing ${profile.name}'s capabilities, category, and FAQs directly in website markup.`,
      problem:
        "Web pages rely purely on unstructured HTML text without machine-readable JSON-LD entity definitions.",
      whyItMatters:
        "Structured semantic schema provides unambiguous entity and capability definitions to web search crawlers and grounding engines.",
      suggestedImprovement: `Add Schema.org ${schemaType} JSON-LD markup to your homepage, pricing page, and key feature pages.`,
      supportingEvidence:
        "Structured entity markup assists search engines in disambiguating brand capabilities from marketing slogans.",
      expectedImpact:
        "Improves entity disambiguation and indexing clarity for search engine crawlers.",
    });
  }

  // 6. Authority & Community Mentions
  if (candidates.length < 3 || isLowScore) {
    candidates.push({
      id: "rec_authority",
      category: "AUTHORITY_BUILDING",
      priority: "MEDIUM",
      title: "Build authentic community discussions and third-party mentions",
      description: `Engage in relevant industry discussions, communities, and technical forums where practitioners share authentic recommendations.`,
      problem: `Limited organic mentions in active community discussions and industry forums for ${profile.name}.`,
      whyItMatters:
        "Conversational AI models frequently cite authentic practitioner recommendations from Reddit, Stack Overflow, GitHub, and niche communities.",
      suggestedImprovement:
        "Participate in authentic industry community threads, publish open-source examples or guides, and foster organic word-of-mouth discussions.",
      supportingEvidence:
        brandEditorialCitations.length === 0
          ? "No editorial roundup citations or community forum references were indexed for your brand in this scan."
          : "Competitors had broader editorial and community citation footprint across search grounding results.",
      expectedImpact:
        "Builds high-trust supporting evidence indexed by conversational search engines.",
    });
  }

  // Priority order: HIGH first, then MEDIUM, then LOW
  const priorityScore = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  candidates.sort((a, b) => priorityScore[b.priority] - priorityScore[a.priority]);

  // Return EXACTLY 3 prioritized actions
  return candidates.slice(0, 3);
}

