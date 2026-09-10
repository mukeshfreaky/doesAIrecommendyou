import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { crawlWebsite } from "../src/crawler/crawler";
import { extractBusinessProfile } from "../src/crawler/extractor";
import {
  generateBuyerQuestions,
  formatDelimitedEvidence,
  validateQuestionQuality,
  SYSTEM_EVALUATOR_INSTRUCTION,
} from "../src/generator/questionGenerator";
import { GeminiProvider } from "../src/providers/gemini";
import { classifyPosture } from "../src/analysis/postureClassifier";
import { detectCompetitors } from "../src/analysis/competitorDetector";
import { aggregateCitations } from "../src/analysis/citationAnalyzer";
import { calculateVisibilityScore } from "../src/scoring/scoringEngine";
import { generateActionableRecommendations } from "../src/recommendations/recommendationEngine";
import { getLiveCallCount } from "../src/providers/safetyGate";

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [k, ...v] = trimmed.split("=");
      if (!process.env[k.trim()]) {
        process.env[k.trim()] = v.join("=").trim();
      }
    }
  }
}

const shouldRunLive = process.env.RUN_LIVE_RESEND === "true";

describe("Live Resend End-to-End Evaluation", () => {
  if (!shouldRunLive) {
    it.skip("Skipping live Resend validation (requires RUN_LIVE_RESEND=true to protect API budget)", () => {});
    return;
  }

  it(
    "executes exactly ONE live grounded 5-question scan for https://resend.com",
    async () => {
      const targetUrl = "https://resend.com";
      console.log("\n================================================================================");
      console.log("EXECUTING AUTHORIZED LIVE END-TO-END SCAN FOR RESEND.COM");
      console.log("================================================================================");

      // 1. Crawl website
      console.log("[1/7] Crawling target website...");
      const crawledPages = await crawlWebsite(targetUrl);
      console.log(`✓ Crawled ${crawledPages.length} pages.`);
      expect(crawledPages.length).toBeGreaterThan(0);

      // 2. Extract Business Profile Evidence
      console.log("[2/7] Extracting business profile evidence...");
      const profile = extractBusinessProfile(crawledPages, targetUrl);
      console.log(`✓ Brand Name:         ${profile.name}`);
      console.log(`✓ Domain:             ${profile.domain}`);
      console.log(`✓ Canonical Category: ${profile.canonicalCategory}`);
      console.log(`✓ Target Audience:    ${profile.targetCustomers.join(", ") || "developers"}`);
      expect(profile.name.toLowerCase()).toContain("resend");

      // 3. Generate 5 Buyer Questions & Quality Validation
      console.log("[3/7] Generating 5 commercial buyer questions...");
      const questions = generateBuyerQuestions(profile);
      expect(questions).toHaveLength(5);

      questions.forEach((q, idx) => {
        const val = validateQuestionQuality(q.question, profile);
        console.log(`  Q${idx + 1} [${q.category}]: "${q.question}"`);
        console.log(`      Validation: ${val.valid ? "PASSED (Evidence-Bound)" : `FAILED: ${val.reason}`}`);
        expect(val.valid).toBe(true);
      });

      // 4. Execute Live Grounded AI Evaluation (Gemini Provider)
      console.log("\n[4/7] Executing live Gemini evaluations with Google Search Grounding tool...");
      const provider = new GeminiProvider();
      expect(provider.isConfigured()).toBe(true);

      const delimitedEvidence = formatDelimitedEvidence(profile);
      const systemPrompt = `${SYSTEM_EVALUATOR_INSTRUCTION}\n\nBUSINESS EVIDENCE REFERENCE (UNTRUSTED DATA):\n${delimitedEvidence}`;

      const questionResults = [];
      const rawResponses = [];
      let totalSearchQueries = 0;
      let totalInputTokens = 0;
      let totalOutputTokens = 0;
      let totalCostUSD = 0;

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        console.log(`\n--- Calling Live Gemini for Q${i + 1} [${q.category}] ---`);
        console.log(`Question: "${q.question}"`);

        const startTime = Date.now();
        const aiResponse = await provider.generateResponse(q.question, systemPrompt, {
          enableSearchGrounding: true,
        });
        const latency = Date.now() - startTime;

        totalSearchQueries += aiResponse.groundingQueries.length;
        totalInputTokens += aiResponse.tokenUsage?.promptTokens || 0;
        totalOutputTokens += aiResponse.tokenUsage?.completionTokens || 0;
        totalCostUSD += aiResponse.estimatedCostUSD;

        const posture = classifyPosture(profile.name, profile.domain, aiResponse.content);
        const questionCompetitors = detectCompetitors(
          [{ text: aiResponse.content, citations: aiResponse.citations.map((c) => c.url) }],
          profile.name,
          profile.domain
        );

        console.log(`  • Status:         ${aiResponse.metadata.searchGroundingStatus}`);
        console.log(`  • Search Queries: ${aiResponse.groundingQueries.length} executed`);
        if (aiResponse.groundingQueries.length > 0) {
          aiResponse.groundingQueries.forEach((sq) => console.log(`      - Query: "${sq}"`));
        }
        console.log(`  • Citations:      ${aiResponse.citations.length} retrieved`);
        if (aiResponse.citations.length > 0) {
          aiResponse.citations.forEach((c) => console.log(`      - Source: ${c.domain} (${c.title})`));
        }
        console.log(`  • Posture:        ${posture.posture} (Rank: ${posture.brandRank || "N/A"})`);
        console.log(`  • Posture Reason: ${posture.recommendationReason}`);
        console.log(`  • Competitors:    ${questionCompetitors.map((c) => c.name).join(", ") || "None detected"}`);
        console.log(`  • Latency/Tokens: ${latency}ms | ${aiResponse.tokenUsage?.promptTokens} in / ${aiResponse.tokenUsage?.completionTokens} out`);

        questionResults.push({
          questionId: q.id,
          category: q.category,
          question: q.question,
          rationale: q.rationale,
          rawAIResponse: aiResponse.content,
          posture: posture.posture,
          brandRank: posture.brandRank,
          recommendationReason: posture.recommendationReason,
          competitors: questionCompetitors,
          citedSources: aiResponse.citations,
          supportingEvidence: posture.supportingEvidence,
          searchQueries: aiResponse.groundingQueries,
          groundingStatus: aiResponse.metadata.searchGroundingStatus,
        });

        rawResponses.push({
          text: aiResponse.content,
          citations: aiResponse.citations.map((c) => c.url),
        });
      }

      // 5. Aggregate Competitors & Citations
      console.log("\n[5/7] Aggregating competitors and citations across all 5 answers...");
      const competitors = detectCompetitors(rawResponses, profile.name, profile.domain);
      const allCitations = aggregateCitations(
        questionResults.map((r) => r.citedSources),
        profile.domain,
        profile.name
      );

      console.log(`✓ Detected ${competitors.length} aggregate competitors:`);
      competitors.forEach((c) => console.log(`   - ${c.name} (${c.frequency}x across responses, Posture: ${c.posture})`));

      console.log(`✓ Total unique citations across all responses: ${allCitations.length}`);
      allCitations.forEach((c) => console.log(`   - ${c.domain} (${c.category}, ${c.frequency}x mentions)`));

      // 6. Calculate Visibility Score Breakdown
      console.log("\n[6/7] Computing Visibility Score...");
      const score = calculateVisibilityScore(questionResults);
      console.log(`✓ Overall Visibility Score:  ${score.overallScore} / 100`);
      console.log(`   Recommendation Rate:       ${score.recommendationRate}%`);
      console.log(`   Top Recommendation Rate:   ${score.topRecommendationRate}%`);
      console.log(`   Consideration Rate:        ${score.considerationRate}%`);
      console.log(`   Cross-Provider Consistency: ${score.crossProviderConsistency !== undefined ? score.crossProviderConsistency : "undefined (VERIFIED: single-provider)"}`);
      expect(score.crossProviderConsistency).toBeUndefined();

      // 7. Prescriptive Recommendations
      console.log("\n[7/7] Generating Actionable Prescriptions...");
      const actionItems = generateActionableRecommendations(
        score,
        questionResults,
        competitors,
        allCitations,
        profile
      );
      actionItems.forEach((item) => {
        console.log(`   [${item.priority}] [${item.category}] ${item.title}`);
        console.log(`       Impact: ${item.expectedImpact}`);
      });

      // Overall grounding status
      const overallGroundingStatus =
        totalSearchQueries > 0 || questionResults.some((q) => q.citedSources.length > 0)
          ? "LIVE_GEMINI_WITH_SEARCH_GROUNDING"
          : "LIVE_GEMINI_WITHOUT_GROUNDING";

      console.log("\n================================================================================");
      console.log("FINAL FORENSIC SCAN SUMMARY");
      console.log("================================================================================");
      console.log(`Overall Grounding Status:     ${overallGroundingStatus}`);
      console.log(`Total Search Queries Executed: ${totalSearchQueries}`);
      console.log(`Total Citations Retrieved:     ${allCitations.length}`);
      console.log(`Total Input Tokens:            ${totalInputTokens}`);
      console.log(`Total Output Tokens:           ${totalOutputTokens}`);
      console.log(`Estimated Scan API Cost:       $${Number(totalCostUSD.toFixed(5))} USD`);
      console.log(`Safety Gate Recorded Calls:    ${getLiveCallCount()} calls`);
      console.log("================================================================================\n");

      // Write forensic report to disk for inspection
      const forensicOutput = {
        scanTimestamp: new Date().toISOString(),
        targetUrl,
        brand: profile.name,
        domain: profile.domain,
        canonicalCategory: profile.canonicalCategory,
        overallGroundingStatus,
        totalSearchQueries,
        totalCitations: allCitations.length,
        estimatedCostUSD: Number(totalCostUSD.toFixed(5)),
        liveCallsConsumed: getLiveCallCount(),
        score,
        questions: questionResults.map((qr) => ({
          questionId: qr.questionId,
          category: qr.category,
          question: qr.question,
          groundingStatus: qr.groundingStatus,
          searchQueries: qr.searchQueries,
          citationsCount: qr.citedSources.length,
          citedSources: qr.citedSources,
          posture: qr.posture,
          brandRank: qr.brandRank,
          recommendationReason: qr.recommendationReason,
          competitors: qr.competitors.map((c) => c.name),
          rawResponsePreview: qr.rawAIResponse.slice(0, 300),
          fullRawResponse: qr.rawAIResponse,
        })),
        competitors,
        citations: allCitations,
        actionItems,
      };

      fs.writeFileSync(
        path.resolve(process.cwd(), "resend_live_scan_report.json"),
        JSON.stringify(forensicOutput, null, 2)
      );
      console.log("✓ Saved forensic report to resend_live_scan_report.json");
    },
    180000 // 3 minutes timeout for 5 live queries
  );
});

