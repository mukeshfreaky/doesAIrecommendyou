import { ActionItem, BusinessProfile, Citation, CompetitorMention, QuestionResult, VisibilityScoreBreakdown } from "@/types";

export function generateActionableRecommendations(
  score: VisibilityScoreBreakdown,
  questionResults: QuestionResult[],
  competitors: CompetitorMention[],
  citations: Citation[],
  profile: BusinessProfile
): ActionItem[] {
  const items: ActionItem[] = [];

  // 1. Citation Source Presence
  const reviewCitations = citations.filter((c) => c.category === "REVIEW_SITE");
  const brandReviewCitations = reviewCitations.filter((c) => c.supportsBrand);

  if (brandReviewCitations.length === 0) {
    const topDomains = Array.from(new Set(reviewCitations.map((c) => c.domain))).slice(0, 3);
    const domainList = topDomains.length > 0 ? topDomains.join(", ") : "G2, Capterra, and TrustRadius";
    items.push({
      id: "rec_citations",
      category: "CITATION_SOURCE",
      priority: "HIGH",
      title: "Establish profiles on key AI-grounded review platforms",
      description: `AI search grounding frequently cited review platforms (${domainList}) when answering buyer queries, but no profiles or customer reviews were indexed for ${profile.name}.`,
      expectedImpact: "High ? Review domains account for over 40% of commercial AI grounding citations.",
      rationale: "LLMs heavily weight verified user review directories for B2B commercial recommendations.",
    });
  }

  // 2. Pricing & Plan Clarity
  if (profile.pricingSignals.length === 0) {
    items.push({
      id: "rec_pricing",
      category: "CONTENT_GAP",
      priority: "HIGH",
      title: "Publish transparent pricing or tier details publicly",
      description: `No pricing signals or plan structures were detected during the website crawl. AI engines default to recommending solutions with transparent, publicly crawlable pricing for cost-conscious buyer queries.`,
      expectedImpact: "High ? Essential for passing price-to-value recommendation filters.",
      rationale: "Search-grounded models penalize 'call for pricing' barriers when answering comparative buyer evaluations.",
    });
  }

  // 3. Competitor Differentiation
  if (competitors.length > 0) {
    const topCompetitor = competitors[0];
    items.push({
      id: "rec_differentiation",
      category: "COMPETITOR_DIFFERENTIATION",
      priority: "MEDIUM",
      title: `Publish direct alternative & comparison pages vs. ${topCompetitor.name}`,
      description: `${topCompetitor.name} was recommended in ${topCompetitor.frequency} evaluated queries. Create dedicated, objective 'Alternative to ${topCompetitor.name}' and comparison pages highlighting your specific advantages.`,
      expectedImpact: "Medium ? Direct capture of switching and alternative evaluation queries.",
      rationale: "AI engines favor objective comparison pages that explicitly contrast technical tradeoffs and workflow differences.",
    });
  }

  // 4. Structured Data & Schema Markup
  items.push({
    id: "rec_schema",
    category: "SCHEMA_METADATA",
    priority: "MEDIUM",
    title: "Implement Schema.org SoftwareApplication & FAQPage JSON-LD",
    description: `Embed structured JSON-LD data describing ${profile.name}'s features, target category, supported platforms, and key FAQs directly on the homepage and product pages.`,
    expectedImpact: "Medium ? Improves LLM crawler semantic parsing fidelity by 30-50%.",
    rationale: "Structured semantic schema provides unambiguous entity and capability definitions to web crawlers.",
  });

  // 5. Authority Building
  if (score.overallScore < 50) {
    items.push({
      id: "rec_authority",
      category: "AUTHORITY_BUILDING",
      priority: "MEDIUM",
      title: "Drive authentic community discussions and third-party mentions",
      description: `Participate in domain discussions on community hubs (Reddit, Hacker News, relevant technical forums) where practitioners ask for real-world software recommendations.`,
      expectedImpact: "High ? Surfaces brand in conversational and community-grounded AI search results.",
      rationale: "Search-grounded models index active community discussions as high-trust recommendations.",
    });
  }

  return items;
}
