// Core domain types for Does AI Recommend You? (Architecture C: Dedicated Web Evidence Retrieval)

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
  canonicalCategory: string;
  canonicalCategoryConfidence: "HIGH" | "MEDIUM" | "LOW";
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

export type AlternativeRelationship =
  | "NOT_APPLICABLE"
  | "BENCHMARK"
  | "DEFENDED"
  | "DISPLACED";

export interface EvidenceClaim {
  claim: string;
  evidenceIds: string[];
}

export interface NormalizedWebEvidenceItem {
  id: string;
  title: string;
  url: string;
  domain: string;
  snippet: string;
  retrievedAt: string;
}

export type QuestionEvidenceStatus =
  | "EVIDENCE_BACKED"
  | "RETRIEVAL_FAILED"
  | "EVALUATION_FAILED"
  | "UNGROUNDED";

export interface QuestionResult {
  questionId: string;
  category: IntentCategory;
  question: string;
  rationale: string;
  rawAIResponse: string;
  posture: RecommendationPosture;
  alternativeRelationship?: AlternativeRelationship;
  brandRank?: number | null;
  recommendationReason: string;
  competitors: CompetitorMention[];
  citedSources: Citation[];
  supportingEvidence: string[];
  searchQueries: string[];
  evidenceStatus?: QuestionEvidenceStatus;
  retrievedEvidence?: NormalizedWebEvidenceItem[];
  claims?: EvidenceClaim[];
}

export interface BenchmarkIndexBreakdown {
  status:
    | "ESTABLISHED_BENCHMARK"
    | "RECOGNIZED_ALTERNATIVE"
    | "DISPLACED_INCUMBENT"
    | "UNRECOGNIZED"
    | "NOT_EVALUATED";
  relationship: AlternativeRelationship;
  score: number; // 0 - 100
  rationale: string;
}

export interface VisibilityScoreBreakdown {
  overallScore: number; // 0 - 100 (Primary prospective AI Recommendation Score)
  recommendationRate: number; // 0 - 100%
  topRecommendationRate: number; // 0 - 100%
  considerationRate: number; // 0 - 100%
  crossProviderConsistency?: number; // 0 - 100%
  supportingCitationCount?: number;
  totalQuestionsEvaluated: number;
  prospectiveQuestionsEvaluated?: number;
  prospectiveQuestionsTotal?: number;
  benchmarkIndex?: BenchmarkIndexBreakdown;
  isPartialEvaluation?: boolean;
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

export type ProviderGroundingStatus =
  | "EVIDENCE_BACKED"
  | "RETRIEVAL_FAILED"
  | "EVALUATION_FAILED"
  | "GROUNDED"
  | "UNGROUNDED"
  | "QUOTA_EXHAUSTED"
  | "ERROR";

export interface ProviderMetadata {
  providerId: string;
  modelId: string;
  searchGroundingEnabled: boolean;
  searchGroundingStatus: ProviderGroundingStatus;
  groundingError?: string;
  searchQueriesExecuted: number;
  retrievalProvider?: string;
  retrievalQueriesExecuted?: number;
  evidenceBackedCount?: number;
  retrievalLatencyMs?: number;
  evaluationLatencyMs?: number;
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
  | "RETRIEVAL_ERROR"
  | "CLASSIFICATION_ERROR"
  | "RATE_LIMIT_EXCEEDED"
  | "INTERNAL_ERROR";
