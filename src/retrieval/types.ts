export interface WebEvidence {
  id: string; // e.g. "EVIDENCE_1"
  title: string;
  url: string;
  domain: string;
  snippet: string;
  retrievedAt: string;
}

export type EvidenceStatus =
  | "EVIDENCE_BACKED"
  | "RETRIEVAL_FAILED"
  | "EVALUATION_FAILED"
  | "UNGROUNDED";

export interface RetrievalOptions {
  maxResults?: number;
  timeoutMs?: number;
  searchDepth?: "basic" | "advanced";
}

export interface RetrievalResult {
  success: boolean;
  evidence: WebEvidence[];
  query: string;
  error?: string;
  latencyMs: number;
  costUSD: number;
}

export interface WebRetriever {
  readonly id: string;
  readonly name: string;
  isConfigured(): boolean;
  retrieve(query: string, options?: RetrievalOptions): Promise<RetrievalResult>;
}