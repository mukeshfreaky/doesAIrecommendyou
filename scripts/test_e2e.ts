import fs from "fs";
import path from "path";
import { crawlWebsite } from "../src/crawler/crawler";
import { extractBusinessProfile } from "../src/crawler/extractor";
import { generateBuyerQuestions, formatDelimitedEvidence, SYSTEM_EVALUATOR_INSTRUCTION } from "../src/generator/questionGenerator";
import { getProvider } from "../src/providers/registry";
import { classifyPosture } from "../src/analysis/postureClassifier";
import { detectCompetitors } from "../src/analysis/competitorDetector";
import { aggregateCitations } from "../src/analysis/citationAnalyzer";
import { calculateVisibilityScore } from "../src/scoring/scoringEngine";
import { generateActionableRecommendations } from "../src/recommendations/recommendationEngine";
import { ScanReport } from "../src/types";

// Load .env.local manually if not in Next runtime
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

async function runLiveEndToEndScan(targetUrl: string) {
  console.log(`=======================================================`);
  console.log(`STARTING REAL END-TO-END PIPELINE AUDIT`);
  console.log(`Target URL: ${targetUrl}`);
  console.log(`=======================================================
`);

  // 1. Crawler
  console.log(`[1/8] Crawling website pages...`);
  const crawledPages = await crawlWebsite(targetUrl);
  console.log(`? Crawled ${crawledPages.length} pages:`);
  crawledPages.forEach((p) => console.log(`   - ${p.url} (${p.title})`));

  // 2. Business Profile Extraction
  console.log(`\n[2/8] Extracting business profile evidence...`);
  const profile = extractBusinessProfile(crawledPages, targetUrl);
  console.log(`✔ Detected Brand: ${profile.name} (${profile.domain})`);
  console.log(`   Canonical Category: ${profile.canonicalCategory} [Confidence: ${profile.canonicalCategoryConfidence}]`);
  console.log(`   Target Customers: ${profile.targetCustomers.join(", ") || "None detected"}`);
  console.log(`   Industries: ${profile.industries.join(", ") || "None (evidence-bound)"}`);
  console.log(`   Pricing Signals: ${profile.pricingSignals.join(", ") || "None detected"}`);

  // 3. Question Generation & Quality Validation
  console.log(`\n[3/8] Generating 5 neutral commercial buyer questions & validating quality...`);
  const questions = generateBuyerQuestions(profile);
  const { validateQuestionQuality } = await import("../src/generator/questionGenerator");
  questions.forEach((q, i) => {
    const val = validateQuestionQuality(q.question, profile);
    console.log(`   Q${i + 1} [${q.category}]: "${q.question}"`);
    console.log(`       Quality Check: ${val.valid ? "PASSED (Evidence-Bound)" : `FAILED (${val.reason})`}`);
  });

  // 4. Provider Inspection
  console.log(`\n[4/8] Inspecting Gemini Provider status...`);
  const provider = getProvider();
  console.log(`   Provider ID: ${provider.id}`);
  console.log(`   Model ID: ${provider.modelId}`);
  console.log(`   Is Configured: ${provider.isConfigured()}`);

  if (!provider.isConfigured()) {
    console.error(`\n=======================================================`);
    console.error(`MANUAL CONFIGURATION BLOCKER FOR LIVE GEMINI SCAN:`);
    console.error(`GEMINI_API_KEY is not configured in .env.local.`);
    console.error(`Per user instructions: We do NOT fake or fabricate live AI scans.`);
    console.error(`To run live search-grounded scans:`);
    console.error(`1. Add GEMINI_API_KEY=<your_key> to .env.local`);
    console.error(`2. Re-run: npx tsx scripts/test_e2e.ts`);
    console.error(`=======================================================`);
    return { status: "BLOCKED_CONFIG", error: "GEMINI_API_KEY is not configured in .env.local" };
  }

  // 5. Live Execution (matching production scan route with real Google Search grounding enabled)
  const enableSearch = process.env.ENABLE_SEARCH_GROUNDING !== "false";
  const executionMode = enableSearch ? "LIVE_GEMINI_WITH_SEARCH_GROUNDING" : "LIVE_GEMINI_WITHOUT_GROUNDING";
  console.log(`\n[5/8] Executing live Gemini evaluation [Mode: ${executionMode}]...`);
  const questionResults = [];
  const rawResponses = [];
  const delimitedEvidence = formatDelimitedEvidence(profile);
  const systemPrompt = `${SYSTEM_EVALUATOR_INSTRUCTION}\n\nBUSINESS EVIDENCE (UNTRUSTED DATA):\n${delimitedEvidence}`;

  for (const q of questions) {
    console.log(`\n   -> Query: "${q.question}"`);
    const aiResponse = await provider.generateResponse(q.question, systemPrompt, {
      enableSearchGrounding: enableSearch,
      maxOutputTokens: 1200,
    });

    console.log(`      • Grounding Status: ${aiResponse.metadata?.searchGroundingStatus}`);
    if (aiResponse.metadata?.groundingError) {
      console.log(`        (Note: Search Grounding quota exhausted on unbilled API key; executed live model inference)`);
    }
    console.log(`      • Grounding Searches (${aiResponse.groundingQueries.length} executed): ${aiResponse.groundingQueries.join("; ") || "None"}`);
    console.log(`      • Citations: ${aiResponse.citations.length}`);
    console.log(`      • Tokens (In/Out): ${aiResponse.tokenUsage?.promptTokens}/${aiResponse.tokenUsage?.completionTokens}`);
    console.log(`      • Estimated Cost: $${aiResponse.estimatedCostUSD.toFixed(5)} USD`);

    const posture = classifyPosture(profile.name, profile.domain, aiResponse.content, q.category);
    const individualCompetitors = detectCompetitors(
      [{ text: aiResponse.content, citations: aiResponse.citations.map((c) => c.url) }],
      profile.name,
      profile.domain
    );

    console.log(`      • Posture: ${posture.posture} (Rank: ${posture.brandRank || "N/A"})`);
    if (posture.alternativeRelationship) {
      console.log(`      • Alternative Relationship: ${posture.alternativeRelationship}`);
    }
    console.log(`      • Reason: ${posture.recommendationReason}`);
    console.log(`      • Competitors Surfaced: ${individualCompetitors.map((c) => c.name).join(", ") || "None"}`);
    console.log(`      • Response Snippet: "${aiResponse.content.slice(0, 160).replace(/\n/g, " ")}..."`);

    questionResults.push({
      questionId: q.id,
      category: q.category,
      question: q.question,
      rationale: q.rationale,
      rawAIResponse: aiResponse.content,
      posture: posture.posture,
      alternativeRelationship: posture.alternativeRelationship,
      brandRank: posture.brandRank,
      recommendationReason: posture.recommendationReason,
      competitors: individualCompetitors,
      citedSources: aiResponse.citations,
      supportingEvidence: posture.supportingEvidence,
      searchQueries: aiResponse.groundingQueries,
      groundingStatus: aiResponse.metadata?.searchGroundingStatus,
      tokenUsage: aiResponse.tokenUsage,
      latencyMs: aiResponse.metadata?.latencyMs,
      estimatedCostUSD: aiResponse.estimatedCostUSD,
    });

    rawResponses.push({
      text: aiResponse.content,
      citations: aiResponse.citations.map((c) => c.url),
    });
  }

  // 6. Cross-Question Competitor and Citation Analysis
  console.log(`\n[6/8] Aggregating competitors & citations across responses...`);
  const competitors = detectCompetitors(rawResponses, profile.name, profile.domain);
  console.log(`✔ Detected ${competitors.length} competitors:`, competitors.map((c) => `${c.name} (${c.frequency}x)`).join(", "));

  const citations = aggregateCitations(
    questionResults.map((r) => r.citedSources),
    profile.domain,
    profile.name
  );
  console.log(`✔ Total unique citations: ${citations.length}`);

  // 7. Scoring
  console.log(`\n[7/8] Calculating Visibility Score Breakdown...`);
  const score = calculateVisibilityScore(questionResults);
  console.log(`✔ Primary AI Recommendation Score: ${score.overallScore} / 100`);
  console.log(`   Recommendation Rate:            ${score.recommendationRate}%`);
  console.log(`   Top Recommendation Rate:        ${score.topRecommendationRate}%`);
  console.log(`   Consideration Rate:             ${score.considerationRate}%`);
  console.log(`   Prospective Scenarios:          ${score.prospectiveQuestionsEvaluated} of ${score.prospectiveQuestionsTotal}`);
  console.log(`   Is Partial Evaluation:          ${score.isPartialEvaluation}`);
  if (score.benchmarkIndex) {
    console.log(`✔ Benchmark Index:                 ${score.benchmarkIndex.status} (${score.benchmarkIndex.relationship}) - Score: ${score.benchmarkIndex.score}`);
    console.log(`   Benchmark Rationale:            ${score.benchmarkIndex.rationale}`);
  }

  // 8. Prescriptions
  console.log(`\n[8/8] Generating Actionable Prescriptions...`);
  const actionItems = generateActionableRecommendations(
    score,
    questionResults,
    competitors,
    citations,
    profile
  );
  actionItems.forEach((item) => console.log(`   [${item.priority}] ${item.title}: ${item.expectedImpact}`));

  const totalCost = questionResults.reduce((acc, q) => acc + (q.estimatedCostUSD || 0), 0);
  const totalSearchQueries = questionResults.reduce((acc, q) => acc + (q.searchQueries?.length || 0), 0);
  const totalInputTokens = questionResults.reduce((acc, q) => acc + (q.tokenUsage?.promptTokens || 0), 0);
  const totalOutputTokens = questionResults.reduce((acc, q) => acc + (q.tokenUsage?.completionTokens || 0), 0);

  console.log(`\n=======================================================`);
  console.log(`LIVE PIPELINE EXECUTION AUDIT COMPLETE`);
  console.log(`=======================================================`);
  console.log(`Total Live Calls:          ${questionResults.length}`);
  console.log(`Total Search Queries:      ${totalSearchQueries}`);
  console.log(`Total Input Tokens:        ${totalInputTokens}`);
  console.log(`Total Output Tokens:       ${totalOutputTokens}`);
  console.log(`Total Estimated Cost USD:  $${totalCost.toFixed(5)} USD`);
  console.log(`Total Estimated Cost INR:  ₹${(totalCost * 84).toFixed(2)} INR`);
  console.log(`=======================================================`);

  // Save forensic report
  const forensicReport = {
    scanTimestamp: new Date().toISOString(),
    targetUrl,
    profile,
    score,
    totalSearchQueries,
    totalEstimatedCostUSD: totalCost,
    totalEstimatedCostINR: totalCost * 84,
    questions: questionResults,
    competitors,
    citations,
    actionItems,
  };

  if (process.env.SAVE_REPORT === "true") {
    fs.writeFileSync(
      path.resolve(process.cwd(), "resend_live_scan_report.json"),
      JSON.stringify(forensicReport, null, 2)
    );
    console.log(`\nForensic scan report saved to resend_live_scan_report.json`);
  }

  return { status: "SUCCESS", score, profile, questionsCount: questions.length };
}

runLiveEndToEndScan("https://resend.com").catch((err) => {
  console.error("Pipeline failure:", err);
});
