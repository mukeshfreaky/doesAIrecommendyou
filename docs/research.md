# Provider Feasibility & Technical Research (Audited)

**Product:** Does AI Recommend You?  
**Document Status:** Audited & Verified against Official Documentation (Phase 0)  
**Date:** September 8, 2026  
**Standard:** Primary official developer documentation only. Verified SDK: `@google/genai` (Google Gen AI SDK v2.21+).

---

## 1. Executive Summary

To answer *"Does AI recommend your business?"*, our engine queries frontier AI models with conversational buyer prompts and evaluates how brands and competitors are recommended.

Per our core product ethic: **NEVER FAKE AI RESULTS**, we rely exclusively on legal, documented, developer-grade APIs with live search grounding. We strictly prohibit scraping consumer chat interfaces (chatgpt.com, perplexity.ai, gemini.google.com), bypassing CAPTCHAs, or fabricating citation data.

---

## 2. In-Depth Provider Audit: Google Gemini

### Official SDK Verification
* **Preferred Modern SDK:** **`@google/genai`** (`googleapis/js-genai`, v2.21+).
* **Legacy SDK Deprecation:** The older `@google/generative-ai` package is superseded for modern 2.x and 3.x features.
* **Initialization:**
  ```typescript
  import { GoogleGenAI } from '@google/genai';
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  ```

### Google Search Grounding Configuration
* Grounding with Google Search is enabled via `config.tools`:
  ```typescript
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash', // Production identifier in current SDK (or gemini-3.8-flash where provisioned)
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
  ```

### Grounding Metadata & Citation Structure
The response exposes:
```typescript
const metadata = response.candidates?.[0]?.groundingMetadata;
// metadata.webSearchQueries: string[] (exact queries Google executed)
// metadata.groundingChunks: Array<{ web?: { uri: string; title: string } }>
// metadata.groundingSupports: Array<{ groundChunkIndices: number[]; segment: { text: string } }>
```
Authoritative citations and page titles are extracted directly from `groundingChunks`.

### Verified Pricing (September 2026)
* **Input Tokens:** $0.75 per 1,000,000 tokens ($0.00000075 / token).
* **Output Tokens (includes thinking tokens):** $3.75 per 1,000,000 tokens ($0.00000375 / token).
* **Search Grounding Fee:**
  * Free Tier: **5,000 free search queries per month** in Google AI Studio.
  * Paid Tier: **$14.00 per 1,000 search queries** ($0.014 per query).

---

## 3. Alternative Provider Comparison

| Dimension | Google Gemini (`@google/genai`) | Perplexity Sonar (Agent API) | OpenAI (Web Search) |
| :--- | :--- | :--- | :--- |
| **Model** | `gemini-2.5-flash` / `gemini-3.8-flash` | `sonar` (Agent API) | `gpt-4o-mini` / `gpt-5.6-sol` |
| **Input Token Rate (/1M)** | $0.75 | $1.00 | $0.15 ? $1.50 |
| **Output Token Rate (/1M)** | $3.75 | $1.00 | $0.60 ? $6.00 |
| **Search Request Fee** | $14.00 / 1k queries | $5.00 ? $14.00 / 1k requests | $10.00 / 1k calls + content tokens |
| **Free Developer Tier** | **5,000 search queries / month** | None ($0 balance rejects) | None |
| **Citation Granularity** | High (URLs, Titles, Claim Offsets) | Moderate (URLs array, inline `[1]`) | Moderate (Markdown URLs) |
| **API Lifecycle Status** | Supported in modern `@google/genai` | Sonar Chat Completions deprecates Sept 27, 2026 | Responses API active |

---

## 4. Re-Evaluated MVP Provider Selection

### **Selected MVP Provider: Google Gemini via `@google/genai` with Google Search Grounding**
1. **Official Standard:** `@google/genai` is Google's active Gen AI SDK with full TypeScript support.
2. **5,000 Free Search Queries Monthly:** Subsidizes initial testing and early user scans with zero grounding fees.
3. **Structured Citation Attribution:** Native `groundingMetadata.groundingChunks` delivers verified URLs and page titles without secondary scraping.
