export type RecommendationPosture =
  | "TOP_RECOMMENDATION"
  | "RECOMMENDED"
  | "CONSIDERED"
  | "MENTIONED"
  | "NOT_MENTIONED";

export type IntentCategory =
  | "CATEGORY_DISCOVERY"
  | "BEST_OF"
  | "ALTERNATIVES"
  | "COMPETITOR_COMPARISON"
  | "USE_CASE"
  | "INDUSTRY"
  | "COMPANY_SIZE"
  | "PRICE_VALUE"
  | "SWITCHING"
  | "FEATURE_SPECIFIC"
  | "EASE_OF_USE";

export interface BuyerQuestion {
  id: string;
  intent: IntentCategory;
  question: string;
  rationale: string;
}

export interface WebsiteEvidence {
  url: string;
  normalizedDomain: string;
  brandName: string;
  brandAliases: string[];
  title: string;
  metaDescription: string;
  headings: string[];
  productSummary: string;
  detectedCompetitors: string[];
  categoryKeywords: string[];
}

export type CitationCategory =
  | "OFFICIAL_WEBSITE"
  | "REVIEW_SITE"
  | "DIRECTORY"
  | "EDITORIAL_COMPARISON"
  | "COMMUNITY_FORUM"
  | "NEWS"
  | "DOCUMENTATION"
  | "OTHER";

export interface Citation {
  url: string;
  domain: string;
  title?: string;
  category: CitationCategory;
  supportsBrand: boolean;
  supportsCompetitor?: string;
  frequency: number;
}

export interface CompetitorMention {
  name: string;
  rank: number;
  posture: RecommendationPosture;
  frequency: number;
  supportingCitations: string[];
}

export interface QuestionAnalysis {
  question: BuyerQuestion;
  rawAIResponse: string;
  posture: RecommendationPosture;
  brandPosition?: number;
  competitors: CompetitorMention[];
  citations: Citation[];
  observedEvidence: string[];
  inferences: string[];
}

export interface VisibilityScoreBreakdown {
  overallScore: number;
  recommendationRate: number;
  topRecommendationRate: number;
  considerationRate: number;
  crossProviderConsistency: number;
  supportingCitationCount: number;
  totalQuestionsEvaluated: number;
}

export type ActionPriority = "HIGH" | "MEDIUM" | "LOW";

export interface PrescriptiveAction {
  id: string;
  title: string;
  priority: ActionPriority;
  observedEvidence: string;
  inference: string;
  recommendedAction: string;
  expectedImpact: string;
}

export interface ScanReport {
  id: string;
  targetUrl: string;
  brandName: string;
  timestamp: string;
  provider: string;
  model: string;
  score: VisibilityScoreBreakdown;
  questionAnalyses: QuestionAnalysis[];
  topCompetitors: CompetitorMention[];
  citations: Citation[];
  prescriptiveActions: PrescriptiveAction[];
  executionCostUSD: number;
}
