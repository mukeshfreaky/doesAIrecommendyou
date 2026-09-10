import { NextRequest, NextResponse } from "next/server";
import { crawlWebsite, normalizeTargetUrl } from "@/crawler/crawler";
import { validateTargetUrl } from "@/crawler/ssrfValidator";
import { extractBusinessProfile } from "@/crawler/extractor";
import { generateBuyerQuestions } from "@/generator/questionGenerator";
import { getProvider } from "@/providers/registry";
import { getWebRetriever } from "@/retrieval";
import {
  SYSTEM_EVIDENCE_EVALUATOR_INSTRUCTION,
  formatRetrievedEvidenceDelimiters,
  validateAndResolveEvaluatorOutput,
} from "@/analysis/evidenceEvaluator";
import { detectCompetitors } from "@/analysis/competitorDetector";
import { aggregateCitations } from "@/analysis/citationAnalyzer";
import { calculateVisibilityScore } from "@/scoring/scoringEngine";
import { generateActionableRecommendations } from "@/recommendations/recommendationEngine";
import { checkRateLimit, extractClientIp } from "@/lib/rateLimit";
import { getRecentScanForDomain, saveScanReport } from "@/lib/scanStorage";
import { ProviderMetadata, QuestionResult, ScanReport } from "@/types";

export const maxDuration = 60; // 60 seconds timeout for full pipeline

export async function POST(req: NextRequest) {
  try {
    // Derive client IP using trusted proxy hierarchy (Cloudflare CF-Connecting-IP > X-Real-IP > Edge-Appended Forwarded IP)
    const clientIp = extractClientIp(req.headers);

    // 1. Rate Limiting (3 scans / IP / 24h)
    const rateCheck = checkRateLimit(clientIp);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: "Daily scan limit reached (3 scans per 24 hours). Please try again tomorrow.",
          code: "RATE_LIMIT_EXCEEDED",
          resetAt: rateCheck.resetAt,
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil((rateCheck.resetAt - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // 2. Parse & Validate Input URL
    const body = await req.json().catch(() => ({}));
    const rawUrl = body.url;

    if (!rawUrl || typeof rawUrl !== "string" || rawUrl.trim().length === 0) {
      return NextResponse.json(
        { error: "A valid business website URL is required.", code: "INVALID_URL" },
        { status: 400 }
      );
    }

    let normalizedUrl: string;
    try {
      normalizedUrl = normalizeTargetUrl(rawUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format. Please provide a valid domain like https://example.com", code: "INVALID_URL" },
        { status: 400 }
      );
    }

    // 3. SSRF Protection
    const ssrfCheck = await validateTargetUrl(normalizedUrl);
    if (!ssrfCheck.isValid) {
      return NextResponse.json(
        {
          error: `Scan blocked for security: ${ssrfCheck.reason || "Forbidden network address."}`,
          code: "SSRF_BLOCKED",
        },
        { status: 400 }
      );
    }

    const domain = new URL(normalizedUrl).hostname.replace(/^www\./, "").toLowerCase();

    // 4. Domain Cooldown / Cache check
    const recent = getRecentScanForDomain(domain);
    if (recent) {
      return NextResponse.json(
        {
          ...recent.report,
          cached: true,
          cacheAgeSeconds: Math.round(recent.ageMs / 1000),
        },
        {
          status: 200,
          headers: { "X-Scan-Cached": "true" },
        }
      );
    }

    // 5. Safe Website Crawl (up to 5 priority pages)
    let crawledPages;
    try {
      crawledPages = await crawlWebsite(normalizedUrl);
    } catch (crawlErr: unknown) {
      const errMsg = crawlErr instanceof Error ? crawlErr.message : String(crawlErr);
      return NextResponse.json(
        {
          error: `Could not crawl website: ${errMsg}. Ensure the site is accessible publicly.`,
          code: "FETCH_FAILED",
        },
        { status: 422 }
      );
    }

    if (!crawledPages || crawledPages.length === 0 || !crawledPages[0].text) {
      return NextResponse.json(
        {
          error: "Could not extract sufficient text content from this website.",
          code: "NO_BUSINESS_CONTENT",
        },
        { status: 422 }
      );
    }

    // 6. Extract Business Profile Evidence
    const businessProfile = extractBusinessProfile(crawledPages, normalizedUrl);

    // 7. Generate 5 Neutral Buyer Questions
    const questions = generateBuyerQuestions(businessProfile);

    // 8. Provider & Retriever Readiness Check
    const provider = getProvider();
    if (!provider.isConfigured()) {
      return NextResponse.json(
        {
          error:
            "Provider configuration error: AI provider API key is not configured on the server. Please check server environment configuration.",
          code: "PROVIDER_ERROR",
        },
        { status: 503 }
      );
    }

    const retriever = getWebRetriever();

    // 9. Execute Architecture C Pipeline (Dedicated Web Retrieval -> Evidence-Bound Evaluator)
    const questionResults: QuestionResult[] = [];
    const rawResponsesForCompetitors: Array<{ text: string; citations?: string[] }> = [];
    let totalRetrievalQueries = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalEstimatedCost = 0;
    let totalRetrievalLatencyMs = 0;
    let totalEvaluationLatencyMs = 0;
    let evidenceBackedCount = 0;
    const startOverallTime = Date.now();

    for (const q of questions) {
      // 9a. Retrieve live web evidence via Tavily
      totalRetrievalQueries++;
      const retrievalResult = await retriever.retrieve(q.question, {
        maxResults: 5,
        timeoutMs: 10000,
        searchDepth: "basic",
      });

      totalRetrievalLatencyMs += retrievalResult.latencyMs;

      if (!retrievalResult.success || retrievalResult.evidence.length === 0) {
        // Retrieval failed or yielded 0 usable results - truthful fallback
        questionResults.push({
          questionId: q.id,
          category: q.category,
          question: q.question,
          rationale: q.rationale,
          rawAIResponse: "",
          posture: "NOT_MENTIONED",
          brandRank: null,
          recommendationReason: "Live web evidence could not be retrieved for this question.",
          competitors: [],
          citedSources: [],
          supportingEvidence: [],
          searchQueries: [q.question],
          evidenceStatus: "RETRIEVAL_FAILED",
          retrievedEvidence: [],
          claims: [],
        });
        continue;
      }

      // 9b. Format delimited evidence for Gemini
      const delimitedEvidence = formatRetrievedEvidenceDelimiters(retrievalResult.evidence);
      const evalPrompt = `Evaluate the following commercial software buyer query for target brand "${businessProfile.name}" (${businessProfile.domain}):

Buyer Question: "${q.question}"

EVALUATION EVIDENCE:
${delimitedEvidence}`;

      // 9c. Call Gemini evaluator with native search grounding DISABLED
      const evalStartTime = Date.now();
      let aiResponse;
      try {
        aiResponse = await provider.generateResponse(
          evalPrompt,
          SYSTEM_EVIDENCE_EVALUATOR_INSTRUCTION,
          {
            enableSearchGrounding: false,
            maxOutputTokens: 1200,
            temperature: 0.1,
          }
        );
      } catch (err: any) {
        const evalLatency = Date.now() - evalStartTime;
        totalEvaluationLatencyMs += evalLatency;
        questionResults.push({
          questionId: q.id,
          category: q.category,
          question: q.question,
          rationale: q.rationale,
          rawAIResponse: "",
          posture: "NOT_MENTIONED",
          brandRank: null,
          recommendationReason: `Evaluator error: ${err.message || String(err)}`,
          competitors: [],
          citedSources: [],
          supportingEvidence: [],
          searchQueries: [q.question],
          evidenceStatus: "EVALUATION_FAILED",
          retrievedEvidence: retrievalResult.evidence,
          claims: [],
        });
        continue;
      }

      const evalLatency = Date.now() - evalStartTime;
      totalEvaluationLatencyMs += evalLatency;

      totalInputTokens += aiResponse.tokenUsage?.promptTokens || 0;
      totalOutputTokens += aiResponse.tokenUsage?.completionTokens || 0;
      totalEstimatedCost += aiResponse.estimatedCostUSD;

      // 9d. Validate structured response & resolve authoritative citations
      const validation = validateAndResolveEvaluatorOutput(
        aiResponse.content,
        retrievalResult.evidence,
        businessProfile.name,
        businessProfile.domain,
        q.category
      );

      if (validation.status === "EVIDENCE_BACKED") {
        evidenceBackedCount++;
      }

      questionResults.push({
        questionId: q.id,
        category: q.category,
        question: q.question,
        rationale: q.rationale,
        rawAIResponse: aiResponse.content,
        posture: validation.posture,
        brandRank: validation.brandRank,
        recommendationReason: validation.recommendationReason,
        competitors: validation.competitors,
        citedSources: validation.citations,
        supportingEvidence: validation.supportingEvidence,
        searchQueries: [q.question],
        evidenceStatus: validation.status,
        retrievedEvidence: retrievalResult.evidence,
        claims: validation.claims,
      });

      rawResponsesForCompetitors.push({
        text: aiResponse.content,
        citations: validation.citations.map((c) => c.url),
      });
    }

    const overallLatencyMs = Date.now() - startOverallTime;

    // 10. Cross-question competitor aggregation
    const competitors = detectCompetitors(
      rawResponsesForCompetitors,
      businessProfile.name,
      businessProfile.domain
    );

    // 11. Cross-question citation aggregation (preserving URL provenance)
    const allCitations = aggregateCitations(
      questionResults.map((r) => r.citedSources),
      businessProfile.domain,
      businessProfile.name
    );

    // 12. Score Calculation
    const score = calculateVisibilityScore(questionResults);

    // 13. Prescriptive Recommendations Engine
    const actionItems = generateActionableRecommendations(
      score,
      questionResults,
      competitors,
      allCitations,
      businessProfile
    );

    // 14. Determine authoritative grounding status
    let searchGroundingStatus: ProviderMetadata["searchGroundingStatus"] = "UNGROUNDED";
    if (evidenceBackedCount === questions.length) {
      searchGroundingStatus = "EVIDENCE_BACKED";
    } else if (evidenceBackedCount > 0) {
      searchGroundingStatus = "EVIDENCE_BACKED";
    } else if (questionResults.some((q) => q.evidenceStatus === "RETRIEVAL_FAILED")) {
      searchGroundingStatus = "RETRIEVAL_FAILED";
    } else if (questionResults.some((q) => q.evidenceStatus === "EVALUATION_FAILED")) {
      searchGroundingStatus = "EVALUATION_FAILED";
    }

    // 15. Assemble Final ScanReport
    const scanId = `scan_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const report: ScanReport = {
      scanId,
      domain: businessProfile.domain,
      businessProfile,
      questions,
      questionResults,
      competitors,
      score,
      actionItems,
      evidence: {
        crawledPagesCount: crawledPages.length,
        sourcePages: crawledPages.map((p) => p.url),
      },
      providerMetadata: {
        providerId: provider.id,
        modelId: provider.modelId,
        searchGroundingEnabled: false, // Architecture C: Gemini native search disabled
        searchGroundingStatus,
        searchQueriesExecuted: 0, // 0 native Gemini search queries
        retrievalProvider: retriever.id,
        retrievalQueriesExecuted: totalRetrievalQueries,
        evidenceBackedCount,
        retrievalLatencyMs: totalRetrievalLatencyMs,
        evaluationLatencyMs: totalEvaluationLatencyMs,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        estimatedCostUSD: Number(totalEstimatedCost.toFixed(5)),
        latencyMs: overallLatencyMs,
      },
      generatedAt: new Date().toISOString(),
    };

    // Save report in memory
    saveScanReport(report);

    return NextResponse.json(report, { status: 200 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "An unexpected internal server error occurred.";
    console.error("[API /api/scan] Fatal error:", err);
    return NextResponse.json(
      { error: errorMsg, code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
