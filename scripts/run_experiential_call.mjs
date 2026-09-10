import fs from "fs";
import path from "path";
import OpenAI from "openai";

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

const baseURL = process.env.EXPLABS_BASE_URL || "https://api.experientiallabs.ai/v1";
const apiKey = process.env.EXPLABS_API_KEY || process.env.OPENAI_API_KEY || "";
const modelId = process.env.OPENAI_MODEL || "gpt-5.6-luna";

console.log("===============================================================");
console.log("EXPERIENTIAL LABS GATEWAY - LIVE CLIENT TEST CALL");
console.log("===============================================================");
console.log(`Base URL:     ${baseURL}`);
console.log(`Model ID:     ${modelId}`);
console.log(`Auth Header:  Bearer ${apiKey.slice(0, 8)}...${apiKey.slice(-6)}`);
console.log("---------------------------------------------------------------");

const client = new OpenAI({
  apiKey,
  baseURL,
});

async function main() {
  console.log(`Executing client.chat.completions.create with model "${modelId}"...`);
  try {
    const response = await client.chat.completions.create({
      model: modelId,
      messages: [
        {
          role: "system",
          content: "You are a concise AI assistant.",
        },
        {
          role: "user",
          content: "What is Resend? Answer in one short sentence.",
        },
      ],
      temperature: 0.1,
    });

    console.log("\n=================== CALL SUCCESSFUL ===================");
    console.log("Response Content:");
    console.log(response.choices[0]?.message?.content);
    console.log("\nToken Usage Details:");
    console.log(`  Prompt Tokens:     ${response.usage?.prompt_tokens}`);
    console.log(`  Completion Tokens: ${response.usage?.completion_tokens}`);
    console.log(`  Total Tokens:      ${response.usage?.total_tokens}`);
    console.log("=======================================================");
  } catch (err) {
    console.log("\n================= GATEWAY RESPONSE =================");
    console.log(`HTTP Status:  ${err.status || err.statusCode || "N/A"}`);
    console.log(`Error Type:   ${err.type || err.error?.type || "N/A"}`);
    console.log(`Error Code:   ${err.code || err.error?.code || "N/A"}`);
    console.log(`Message:      ${err.message}`);
    if (err.error) {
      console.log("\nFull Error Payload from Experiential Gateway:");
      console.log(JSON.stringify(err.error, null, 2));
    }
    console.log("=====================================================");
  }
}

main();

