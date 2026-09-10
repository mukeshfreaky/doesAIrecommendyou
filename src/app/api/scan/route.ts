import { NextRequest, NextResponse } from "next/server";
import { crawlWebsite, normalizeTargetUrl } from "@/crawler/crawler";
import { validateTargetUrl } from "@/crawler/ssrfValidator";
import { extractBusinessProfile } from "@/crawler/extractor";
import { generateBuyerQuestions, formatDelimitedEvidence, SYSTEM_EVALUATOR_INSTRUCTION } from "@/generator/questionGenerator";
import { getProvider } from "@/providers/registry";
import { classifyPosture } from "@/analysis/postureClassifier";
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

    // 8. Provider Check
    const provider = getProvider();
    if (!provider.isConfigured()) {
      return NextResponse.json(
        {
          error:
            "Provider configuration error: GEMINI_API_KEY is not configured on the server. Please add your GEMINI_API_KEY to .env.local to execute live grounded scans.",
          code: "PROVIDER_ERROR",
        },
        { status: 503 }
      );
    }

    // 9. Execute Grounded Evaluation for each question
    const questionResults: QuestionResult[] = [];
    const rawResponsesForCompetitors: Array<{ text: string; citations?: string[] }> = [];
    let totalSearchQueries = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalEstimatedCost = 0;
    let lastMetadata: ProviderMetadata | undefined;
    const startOverallTime = Date.now();

    const delimitedEvidence = formatDelimitedEvidence(businessProfile);
    const systemEvaluatorPrompt = `${SYSTEM_EVALUATOR_INSTRUCTION}\n\nBUSINESS EVIDENCE REFERENCE (UNTRUSTED DATA):\n${delimitedEvidence}`;

    for (const q of questions) {
      const aiResponse = await provider.generateResponse(
        q.question,
        systemEvaluatorPrompt,
        { enableSearchGrounding: true, maxOutputTokens: 1200 }
      );

      lastMetadata = aiResponse.metadata;
      totalSearchQueries += aiResponse.groundingQueries.length;
      totalInputTokens += aiResponse.tokenUsage?.promptTokens || 0;
      totalOutputTokens += aiResponse.tokenUsage?.completionTokens || 0;
      totalEstimatedCost += aiResponse.estimatedCostUSD;

      // Classify posture with intent awareness
      const postureResult = classifyPosture(
        businessProfile.name,
        businessProfile.domain,
        aiResponse.content,
        q.category
      );

      // Extract competitors from this individual response
      const individualCompetitors = detectCompetitors(
        [{ text: aiResponse.content, citations: aiResponse.citations.map((c) => c.url) }],
        businessProfile.name,
        businessProfile.domain
      );

      questionResults.push({
        questionId: q.id,
        category: q.category,
        question: q.question,
        rationale: q.rationale,
        rawAIResponse: aiResponse.content,
        posture: postureResult.posture,
        alternativeRelationship: postureResult.alternativeRelationship,
        brandRank: postureResult.brandRank,
        recommendationReason: postureResult.recommendationReason,
        competitors: individualCompetitors,
        citedSources: aiResponse.citations,
        supportingEvidence: postureResult.supportingEvidence,
        searchQueries: aiResponse.groundingQueries,
      });

      rawResponsesForCompetitors.push({
        text: aiResponse.content,
        citations: aiResponse.citations.map((c) => c.url),
      });
    }

    const overallLatencyMs = Date.now() - startOverallTime;

    // 10. Cross-question competitor aggregation
    const competitors = detectCompetitors(
      rawResponsesForCompetitors,
      businessProfile.name,
      businessProfile.domain
    );

    // 11. Cross-question citation aggregation
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

    // 14. Assemble Final ScanReport
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
        searchGroundingEnabled: lastMetadata?.searchGroundingEnabled ?? true,
        searchGroundingStatus:
          totalSearchQueries > 0 || questionResults.some((q) => q.citedSources.length > 0)
            ? "GROUNDED"
            : "UNGROUNDED",
        groundingError: lastMetadata?.groundingError,
        searchQueriesExecuted: totalSearchQueries,
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
