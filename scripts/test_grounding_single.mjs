import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";

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

  const apiKey = process.env.GEMINI_API_KEY;
  const modelId = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
  const liveEnabled = process.env.AI_LIVE_ENABLED === "true";
  const maxCalls = parseInt(process.env.AI_MAX_LIVE_CALLS || "10", 10);

  console.log(`Provider:                 Google Gemini (google_gemini)`);
  console.log(`Configured Model:         ${modelId}`);
  console.log(`API Key Configured:       ${Boolean(apiKey && apiKey.length > 0)}`);
  console.log(`Safety Gate Active:       AI_LIVE_ENABLED=${liveEnabled}, AI_MAX_LIVE_CALLS=${maxCalls}`);
  console.log("--------------------------------------------------------------------------------");

  if (!liveEnabled) {
    console.error("[AI Safety Gate Blocked]: AI_LIVE_ENABLED is not set to 'true'. Refusing live call.");
    process.exit(1);
  }

  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing from environment.");
    process.exit(1);
  }

  const client = new GoogleGenAI({ apiKey });
  const question = "What are the leading transactional email API providers for developers?";
  console.log(`Question: "${question}"`);
  console.log(`Search Grounding: ENABLED (Real Google Search Tool: [{ googleSearch: {} }])`);
  console.log(`\nSending request to Google Gemini API...`);

  const startTime = Date.now();
  try {
    const response = await client.models.generateContent({
      model: modelId,
      contents: question,
      config: {
        tools: [{ googleSearch: {} }],
        maxOutputTokens: 1000,
      },
    });
    const latencyMs = Date.now() - startTime;

    const candidate = response.candidates?.[0];
    const content =
      candidate?.content?.parts?.map((p) => p.text || "").join("") ||
      response.text ||
      "";
    const rawGrounding = candidate?.groundingMetadata;
    const searchQueries = rawGrounding?.webSearchQueries || [];
    const groundingChunks = rawGrounding?.groundingChunks || [];

    const isGrounded = searchQueries.length > 0 || groundingChunks.length > 0;
    const actualStatus = isGrounded ? "GROUNDED" : "UNGROUNDED";

    const promptTokens = response.usageMetadata?.promptTokenCount || 0;
    const completionTokens = response.usageMetadata?.candidatesTokenCount || 0;
    const totalTokens = response.usageMetadata?.totalTokenCount || (promptTokens + completionTokens);

    const tokenCost = (promptTokens / 1_000_000) * 0.15 + (completionTokens / 1_000_000) * 0.60;
    const searchCost = searchQueries.length * 0.035;
    const estimatedCostUSD = Number((tokenCost + searchCost).toFixed(6));

    console.log("\n======================== RAW RESPONSE AUDIT ========================");
    console.log(`Request Status:            SUCCEEDED`);
    console.log(`Provider:                  google_gemini`);
    console.log(`Model Used:                ${modelId}`);
    console.log(`Search Grounding Requested: true`);
    console.log(`Actual Grounding Status:   ${actualStatus}`);
    console.log(`Search Queries Executed:   ${searchQueries.length}`);
    if (searchQueries.length > 0) {
      console.log(`Queries:`);
      searchQueries.forEach((q, idx) => console.log(`  [${idx + 1}] "${q}"`));
    }

    console.log(`\nCitations / Grounding Chunks (${groundingChunks.length} chunks):`);
    groundingChunks.forEach((chunk, idx) => {
      const uri = chunk.web?.uri;
      const title = chunk.web?.title;
      console.log(`  [${idx + 1}] Title: ${title || "N/A"}`);
      if (uri) console.log(`      URI:   ${uri}`);
    });

    if (rawGrounding?.groundingSupports) {
      console.log(`\nGrounding Supports (${rawGrounding.groundingSupports.length} segments cited):`);
      rawGrounding.groundingSupports.forEach((sup, idx) => {
        console.log(`  [${idx + 1}] Chunks [${sup.groundingChunkIndices?.join(", ")}]: "${sup.segment?.text?.slice(0, 100)}..."`);
      });
    }

    console.log(`\nToken Usage:`);
    console.log(`  Prompt Tokens:           ${promptTokens}`);
    console.log(`  Completion Tokens:       ${completionTokens}`);
    console.log(`  Total Tokens:            ${totalTokens}`);
    console.log(`Estimated Cost USD:        $${estimatedCostUSD}`);
    console.log(`Latency:                   ${latencyMs}ms`);

    console.log(`\nResponse Text Content:`);
    console.log("--------------------------------------------------------------------------------");
    console.log(content.trim());
    console.log("--------------------------------------------------------------------------------");

    console.log("\nSAFETY GATE AUDIT: 1 live call consumed against development budget.");
    console.log("================================================================================");
  } catch (err) {
    console.error("\n========================= REQUEST FAILED =========================");
    console.error(`Request Status:            FAILED`);
    console.error(`Error Message:             ${err.message}`);
    if (err.stack) console.error(`Stack: ${err.stack}`);
    console.error("================================================================================");
    process.exit(1);
  }
}

runSingleGroundingTest();

