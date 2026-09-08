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
    const domainList = topDomains.length > 0 ? topDomains.join(", ") : "G2, Capterra, or TrustRadius";
    items.push({
      id: "rec_citations",
      category: "CITATION_SOURCE",
      priority: "HIGH",
      title: "Establish profiles on key AI-grounded review platforms",
      description: `Search grounding frequently cited third-party review directories (${domainList}) when answering buyer queries, but no profiles or customer reviews were indexed for ${profile.name}.`,
      expectedImpact: "Potentially useful supporting evidence ? third-party review directories often serve as trusted corroborating sources in search grounding.",
      rationale: "Search-grounded models rely on independent third-party aggregators to verify commercial claims.",
    });
  }

  // 2. Pricing & Plan Clarity
  if (profile.pricingSignals.length === 0) {
    items.push({
      id: "rec_pricing",
      category: "CONTENT_GAP",
      priority: "HIGH",
      title: "Publish transparent pricing or tier details publicly",
      description: `No pricing signals or plan structures were detected during the website crawl. AI engines frequently filter for publicly accessible pricing information when answering cost-conscious buyer queries.`,
      expectedImpact: "Can make product and category information easier for crawlers to interpret for budget and value queries.",
      rationale: "Search-grounded models struggle to evaluate cost-benefit tradeoffs when pricing is gated behind sales inquiries.",
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
      description: `${topCompetitor.name} was recommended across ${topCompetitor.frequency} evaluated queries. Publishing objective comparison pages helps search crawlers identify your specific functional tradeoffs.`,
      expectedImpact: "May improve comparative visibility against recognized incumbents for alternative buyer searches.",
      rationale: "Search-grounded models retrieve comparison pages when answering switching and alternative queries.",
    });
  }

  // 4. Structured Data & Schema Markup
  items.push({
    id: "rec_schema",
    category: "SCHEMA_METADATA",
    priority: "MEDIUM",
    title: "Implement Schema.org SoftwareApplication & FAQPage JSON-LD",
    description: `Embed structured JSON-LD data describing ${profile.name}'s features, target category, and key FAQs directly in website markup.`,
    expectedImpact: "May improve machine-readable understanding and entity disambiguation for web crawlers.",
    rationale: "Structured semantic schema provides unambiguous entity and capability definitions to web crawlers.",
  });

  // 5. Authority Building
  if (score.overallScore < 50) {
    items.push({
      id: "rec_authority",
      category: "AUTHORITY_BUILDING",
      priority: "MEDIUM",
      title: "Drive authentic community discussions and third-party mentions",
      description: `Engage in relevant technical and industry discussions where practitioners ask for real-world software recommendations.`,
      expectedImpact: "Potentially useful supporting evidence for conversational and community-grounded AI search results.",
      rationale: "Search-grounded models index active community discussions as high-trust recommendations.",
    });
  }

  return items;
}
