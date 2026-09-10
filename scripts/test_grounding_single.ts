import fs from "fs";
import path from "path";
import { GeminiProvider } from "../src/providers/gemini";
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

async function runSingleGroundingTest() {
  console.log("================================================================================");
  console.log("TEST 1: SINGLE GROUNDED REQUEST AUDIT (Google Gemini + Real Google Search)");
  console.log("================================================================================");

  const provider = new GeminiProvider();
  console.log(`Provider:                 ${provider.name} (${provider.id})`);
  console.log(`Configured Model:         ${provider.modelId}`);
  console.log(`Is Configured:            ${provider.isConfigured()}`);
  console.log(`Safety Gate Active:       AI_LIVE_ENABLED=${process.env.AI_LIVE_ENABLED}, AI_MAX_LIVE_CALLS=${process.env.AI_MAX_LIVE_CALLS}`);
  console.log("--------------------------------------------------------------------------------");

  const question = "What are the leading transactional email API providers for developers?";
  console.log(`Question: "${question}"`);
  console.log(`Search Grounding: ENABLED (Real Google Search Tool)`);
  console.log(`\nSending request to Google Gemini API...`);

  const startTime = Date.now();
  try {
    const response = await provider.generateResponse(question, undefined, {
      enableSearchGrounding: true,
      maxOutputTokens: 1000,
    });
    const latencyMs = Date.now() - startTime;

    console.log("\n======================== RAW RESPONSE AUDIT ========================");
    console.log(`Request Status:            SUCCEEDED`);
    console.log(`Provider:                  ${response.metadata.providerId}`);
    console.log(`Model Used:                ${response.metadata.modelId}`);
    console.log(`Search Grounding Requested: true`);
    console.log(`Actual Grounding Status:   ${response.metadata.searchGroundingStatus}`);
    console.log(`Search Queries Executed:   ${response.metadata.searchQueriesExecuted}`);
    if (response.groundingQueries.length > 0) {
      console.log(`Queries:`);
      response.groundingQueries.forEach((q, idx) => console.log(`  [${idx + 1}] "${q}"`));
    }
    console.log(`\nCitations / Grounding Sources (${response.citations.length} sources):`);
    response.citations.forEach((c, idx) => {
      console.log(`  [${idx + 1}] ${c.domain} (${c.category}) - ${c.title}`);
      if (c.url) console.log(`      URL: ${c.url}`);
    });

    console.log(`\nToken Usage:`);
    console.log(`  Prompt Tokens:           ${response.tokenUsage?.promptTokens}`);
    console.log(`  Completion Tokens:       ${response.tokenUsage?.completionTokens}`);
    console.log(`  Total Tokens:            ${response.tokenUsage?.totalTokens}`);
    console.log(`Estimated Cost USD:        $${response.estimatedCostUSD}`);
    console.log(`Latency:                   ${latencyMs}ms`);

    console.log(`\nResponse Text Content (Preview):`);
    console.log("--------------------------------------------------------------------------------");
    console.log(response.content.trim());
    console.log("--------------------------------------------------------------------------------");

    console.log(`\nLive Calls Recorded By Safety Gate: ${getLiveCallCount()}`);
    console.log("================================================================================");
    return { success: true, response };
  } catch (err: any) {
    console.error("\n========================= REQUEST FAILED =========================");
    console.error(`Request Status:            FAILED`);
    console.error(`Error Message:             ${err.message}`);
    if (err.stack) console.error(`Stack: ${err.stack}`);
    console.error("================================================================================");
    return { success: false, error: err.message };
  }
}

runSingleGroundingTest().then((result) => {
  if (!result.success) {
    process.exit(1);
  }
});

