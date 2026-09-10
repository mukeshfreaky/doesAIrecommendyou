import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { OpenAIProvider } from "../src/providers/openai";

// Load .env.local manually if running in standalone ts-node / node script
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

async function runTestCall() {
  const apiKey = process.env.EXPLABS_API_KEY || process.env.OPENAI_API_KEY || "";
  const baseURL = process.env.EXPLABS_BASE_URL || "https://api.experientiallabs.ai/v1";
  const modelId = process.env.OPENAI_MODEL || "gpt-5.6-luna";

  console.log("===============================================================");
  console.log("EXPERIENTIAL LABS GATEWAY TEST CALL");
  console.log("===============================================================");
  console.log(`Base URL:   ${baseURL}`);
  console.log(`Model ID:   ${modelId}`);
  console.log(`API Key:    ${apiKey.slice(0, 7)}...${apiKey.slice(-6)}`);
  console.log("---------------------------------------------------------------");

  // 1. Direct OpenAI Client test
  console.log("\n[1/2] Initiating OpenAI Chat Completion via Experiential Gateway...");
  const client = new OpenAI({
    apiKey,
    baseURL,
  });

  try {
    const response = await client.chat.completions.create({
      model: modelId,
      messages: [
        {
          role: "system",
          content: "You are a helpful business intelligence assistant. Keep answers brief.",
        },
        {
          role: "user",
          content: "In one concise sentence, what is transactional email?",
        },
      ],
      temperature: 0.2,
    });

    console.log("\nSUCCESSFUL RESPONSE FROM EXPERIENTIAL GATEWAY:");
    console.log(`Model Used:        ${response.model}`);
    console.log(`Message Reply:     ${response.choices[0]?.message?.content}`);
    console.log("\nTOKEN USAGE:");
    console.log(`Prompt Tokens:     ${response.usage?.prompt_tokens}`);
    console.log(`Completion Tokens: ${response.usage?.completion_tokens}`);
    console.log(`Total Tokens:      ${response.usage?.total_tokens}`);
  } catch (err: any) {
    console.log("\n[!] Experiential Gateway Response:");
    console.log(`HTTP Status:  ${err.status || "N/A"}`);
    console.log(`Error Code:   ${err.code || err.error?.code || "N/A"}`);
    console.log(`Error Type:   ${err.type || err.error?.type || "N/A"}`);
    console.log(`Message:      ${err.message}`);
    if (err.error) {
      console.log(`Gateway Body: ${JSON.stringify(err.error, null, 2)}`);
    }
  }

  // 2. OpenAIProvider Integration Test
  console.log("\n[2/2] Testing OpenAIProvider class integration...");
  const provider = new OpenAIProvider();
  console.log(`Provider ID:          ${provider.id}`);
  console.log(`Provider Name:        ${provider.name}`);
  console.log(`Provider Model:       ${provider.modelId}`);
  console.log(`Provider Configured:  ${provider.isConfigured()}`);

  try {
    const res = await provider.generateResponse("In 5 words, describe cloud email.");
    console.log(`Content:              ${res.content}`);
    console.log(`Token Usage:          ${JSON.stringify(res.tokenUsage)}`);
    console.log(`Estimated Cost:       $${res.estimatedCostUSD}`);
  } catch (err: any) {
    console.log(`Provider caught error: ${err.message}`);
  }

  console.log("===============================================================");
}

runTestCall().catch((e) => {
  console.error("Unexpected failure:", e);
  process.exit(1);
});

