import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";

let liveCallCount = 1; // 1 was consumed in earlier test
function checkSafety() {
  const liveEnabled = process.env.AI_LIVE_ENABLED === "true";
  const maxCalls = parseInt(process.env.AI_MAX_LIVE_CALLS || "10", 10);
  if (!liveEnabled) return { allowed: false, reason: "AI_LIVE_ENABLED is not true" };
  if (liveCallCount >= maxCalls) return { allowed: false, reason: "AI_MAX_LIVE_CALLS reached" };
  liveCallCount++;
  return { allowed: true, currentCount: liveCallCount, maxCalls };
}

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

async function runControlledDiagnostic() {
  console.log("================================================================================");
  console.log("CONTROLLED DIAGNOSTIC: TIME-SENSITIVE QUERY FOR GOOGLE SEARCH GROUNDING");
  console.log("================================================================================");

  const apiKey = process.env.GEMINI_API_KEY;
  const modelId = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
  const liveEnabled = process.env.AI_LIVE_ENABLED === "true";
  const maxCalls = parseInt(process.env.AI_MAX_LIVE_CALLS || "10", 10);

  console.log(`Model:                ${modelId}`);
  console.log(`API Key Configured:   ${Boolean(apiKey && apiKey.length > 0)} (Length: ${apiKey?.length})`);
  console.log(`Safety Gate Status:   AI_LIVE_ENABLED=${liveEnabled}, AI_MAX_LIVE_CALLS=${maxCalls}`);
  console.log(`Current Live Calls:   ${liveCallCount}`);

  if (!liveEnabled) {
    console.error("[ABORTED] AI_LIVE_ENABLED is not true.");
    process.exit(1);
  }

  // Safety gate check
  const safety = checkSafety();
  if (!safety.allowed) {
    console.error(`[SAFETY GATE REFUSAL]: ${safety.reason}`);
    process.exit(1);
  }
  console.log(`Safety Gate Approved: Call #${safety.currentCount} of ${safety.maxCalls}`);
  console.log("--------------------------------------------------------------------------------");

  const prompt = "What is the current CEO of OpenAI as of September 2026, and what is the latest publicly announced OpenAI product?";
  console.log(`Diagnostic Prompt: "${prompt}"`);
  console.log(`Configuring Tool: tools: [{ googleSearch: {} }]`);
  console.log(`Sending to Google Gemini API...`);

  const client = new GoogleGenAI({ apiKey });
  const startTime = Date.now();

  try {
    const response = await client.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        maxOutputTokens: 1000,
      },
    });
    const latencyMs = Date.now() - startTime;

    console.log(`\nResponse received in ${latencyMs}ms. Succeeded!`);
    console.log("======================== COMPLETE RAW AUDIT ========================");
    console.log("Response Keys:", Object.keys(response));
    console.log("Model Version:", response.modelVersion);
    console.log("Response ID:", response.responseId);
    console.log("Usage Metadata:", JSON.stringify(response.usageMetadata, null, 2));

    const candidate = response.candidates?.[0];
    console.log("\nCandidate Keys:", Object.keys(candidate || {}));
    console.log("Finish Reason:", candidate?.finishReason);
    console.log("Citation Metadata:", JSON.stringify(candidate?.citationMetadata, null, 2));

    const rawGrounding = candidate?.groundingMetadata;
    console.log("\n--- RAW GROUNDING METADATA ---");
    if (!rawGrounding) {
      console.log("groundingMetadata is undefined / null");
    } else {
      console.log(JSON.stringify(rawGrounding, null, 2));
    }

    const webSearchQueries = rawGrounding?.webSearchQueries || [];
    const groundingChunks = rawGrounding?.groundingChunks || [];
    const groundingSupports = rawGrounding?.groundingSupports || [];
    const searchEntryPoint = rawGrounding?.searchEntryPoint;

    console.log("\n--- SUMMARY OF GROUNDING ARTIFACTS ---");
    console.log(`Web Search Queries Count: ${webSearchQueries.length}`);
    webSearchQueries.forEach((q, i) => console.log(`  Query [${i + 1}]: "${q}"`));

    console.log(`\nGrounding Chunks Count:   ${groundingChunks.length}`);
    groundingChunks.forEach((c, i) => {
      console.log(`  Chunk [${i + 1}]: ${c.web?.title} | URI: ${c.web?.uri}`);
    });

    console.log(`\nGrounding Supports Count: ${groundingSupports.length}`);
    groundingSupports.forEach((s, i) => {
      console.log(`  Support [${i + 1}]: Chunks [${s.groundingChunkIndices?.join(", ")}] -> "${s.segment?.text?.slice(0, 80)}..."`);
    });

    if (searchEntryPoint) {
      console.log(`Search Entry Point rendered HTML / widget: ${Boolean(searchEntryPoint.renderedContent)}`);
    }

    console.log("\n--- GENERATED TEXT CONTENT ---");
    const content =
      candidate?.content?.parts?.map((p) => p.text || "").join("") ||
      response.text ||
      "";
    console.log(content.trim());
    console.log("--------------------------------------------------------------------------------");
    console.log(`Total live calls consumed by safety gate: ${liveCallCount}`);
  } catch (err) {
    console.error("Diagnostic execution error:", err);
  }
}

runControlledDiagnostic();
