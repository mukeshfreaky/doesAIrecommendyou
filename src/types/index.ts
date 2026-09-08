// Core domain types for Does AI Recommend You? (Phase 1)

export type RecommendationPosture =
  | "TOP_RECOMMENDATION"
  | "RECOMMENDED"
  | "CONSIDERED"
  | "MENTIONED"
  | "NOT_MENTIONED"
  | "AMBIGUOUS";

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
  category: IntentCategory;
  question: string;
  rationale: string;
}

export interface CrawledPage {
  url: string;
  title: string;
  description: string;
  headings: string[];
  text: string;
  links: string[];
  fetchedAt: string;
}

export interface BusinessProfile {
  name: string;
  domain: string;
  description: string;
  productsOrServices: string[];
  targetCustomers: string[];
  industries: string[];
  pricingSignals: string[];
  keyFeatures: string[];
  useCases: string[];
  locations: string[];
  differentiators: string[];
  sourcePages: string[];
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
  rank?: number;
  posture: RecommendationPosture;
  frequency: number;
  supportingCitations: string[];
}

export interface QuestionResult {
  questionId: string;
  category: IntentCategory;
  question: string;
  rationale: string;
  rawAIResponse: string;
  posture: RecommendationPosture;
  brandRank?: number;
  recommendationReason: string;
  competitors: CompetitorMention[];
  citedSources: Citation[];
  supportingEvidence: string[];
  searchQueries: string[];
}

export interface VisibilityScoreBreakdown {
  overallScore: number; // 0 - 100
  recommendationRate: number; // 0 - 100%
  topRecommendationRate: number; // 0 - 100%
  considerationRate: number; // 0 - 100%
  crossProviderConsistency?: number; // 0 - 100%
  supportingCitationCount?: number;
  totalQuestionsEvaluated: number;
}
export interface ActionItem {
  id: string;
  category:
    | "CONTENT_GAP"
    | "CITATION_SOURCE"
    | "COMPETITOR_DIFFERENTIATION"
    | "SCHEMA_METADATA"
    | "AUTHORITY_BUILDING";
  priority: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  expectedImpact: string;
  rationale: string;
}


export interface ProviderMetadata {
  providerId: string;
  modelId: string;
  searchGroundingEnabled: boolean;
  searchQueriesExecuted: number;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCostUSD: number;
  latencyMs: number;
}

export interface ScanReport {
  scanId: string;
  domain: string;
  businessProfile: BusinessProfile;
  questions: BuyerQuestion[];
  questionResults: QuestionResult[];
  competitors: CompetitorMention[];
  score: VisibilityScoreBreakdown;
  actionItems: ActionItem[];
  evidence: {
    crawledPagesCount: number;
    sourcePages: string[];
  };
  providerMetadata: ProviderMetadata;
  generatedAt: string;
}

export type ScanErrorCode =
  | "INVALID_URL"
  | "SSRF_BLOCKED"
  | "FETCH_FAILED"
  | "NO_BUSINESS_CONTENT"
  | "PROVIDER_ERROR"
  | "GROUNDING_ERROR"
  | "CLASSIFICATION_ERROR"
  | "RATE_LIMIT_EXCEEDED"
  | "INTERNAL_ERROR";
