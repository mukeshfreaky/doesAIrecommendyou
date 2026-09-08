# Provider Feasibility & Technical Research (Audited)

**Product:** Does AI Recommend You?  
**Document Status:** Audited & Verified against Official Documentation (Phase 0)  
**Date:** September 8, 2026  
**Audit Standard:** Primary official developer documentation only. Unverified legacy claims removed.

---

## 1. Executive Summary

To answer *"Does AI recommend your business?"*, our engine queries frontier AI models with conversational buyer prompts and evaluates how brands and competitors are recommended.

Per our core product ethic: **NEVER FAKE AI RESULTS**, we rely exclusively on legal, documented, developer-grade APIs with live search grounding. We strictly prohibit scraping consumer chat interfaces (chatgpt.com, perplexity.ai, gemini.google.com), bypassing CAPTCHAs, or fabricating citation data.

This audit establishes the verified capabilities, current model identifiers, grounding mechanics, and official rate cards for:
1. **Google Gemini API** (Google AI for Developers / Vertex AI)
2. **Perplexity API** (Agent API / Sonar models)
3. **OpenAI API** (Responses API / Web Search tool)
4. **Anthropic Claude API** (Custom tool retrieval status)

---

## 2. In-Depth Provider Audit

### A. Google Gemini API (Grounding with Google Search)

* **Primary Official Source:** [ai.google.dev/pricing](https://ai.google.dev/pricing), [ai.google.dev/gemini-api/docs/grounding](https://ai.google.dev/gemini-api/docs/grounding)
* **Current Model Family (Verified September 2026):** **Gemini 3.8 Flash** (`gemini-3.8-flash`) is the current efficiency and high-speed model family. Legacy 1.5/2.0 models are superseded.
* **Web Grounding Architecture:**
  * Configured via `tools: [{ googleSearch: {} }]` (or `google_search`).
  * Executes live Google Search queries and injects grounded web citations into the response.
* **Citation & Metadata Quality:**
  * Returns `groundingMetadata` containing:
    * `webSearchQueries`: The exact search queries Google executed to ground the answer.
    * `groundingChunks`: Array of web sources with verified URLs (`uri`) and page titles (`title`).
    * `groundingSupports`: Precise sentence-level text segment offsets mapped to corresponding sources.
* **Verified Pricing (Through Dec 31, 2026 Introductory Rate):**
  * **Input Tokens:** $0.75 per 1,000,000 tokens ($0.00000075 / token).
  * **Output Tokens (includes thinking tokens):** $3.75 per 1,000,000 tokens ($0.00000375 / token).
  * **Context Caching:** $0.075 / 1M tokens (read), $0.50 / 1M tokens/hour (storage).
* **Verified Search Grounding Quotas & Fees:**
  * **Free Tier Quota:** **5,000 free search requests per month** (shared across Gemini 3.x models in Google AI Studio).
  * **Paid Tier Search Fee:** **$14.00 per 1,000 search queries** ($0.014 per search query).
  * *Note on query count:* A single prompt may execute 1 to 2 search queries depending on prompt complexity.
* **Terms of Service Compliance:** Fully compliant with Google Generative AI API terms. Permitted for commercial programmatic synthesis.

---

### B. Perplexity API (Sonar & Agent API)

* **Primary Official Source:** [docs.perplexity.ai](https://docs.perplexity.ai), [perplexity.ai/pricing](https://perplexity.ai/pricing)
* **API Lifecycle Notice (Critical Audit Finding):**
  * Perplexity is officially phasing out the legacy **Sonar Chat Completions API**, with end-of-support on **September 27, 2026**.
  * All new implementations must target the **Agent API**.
* **Current Model Family:**
  * `sonar` (Lightweight web search model)
  * `sonar-pro` (Deep search model)
  * `sonar-reasoning-pro`
  * `sonar-deep-research`
* **Verified Pricing:**
  * **`sonar` Tokens:** $1.00 / 1M input tokens, $1.00 / 1M output tokens.
  * **`sonar-pro` Tokens:** $3.00 / 1M input tokens, $15.00 / 1M output tokens.
  * **Per-Request Search Fee:** **$5.00 to $14.00 per 1,000 requests** ($0.005 to $0.014 per request depending on search context depth).
* **Citation & Metadata Quality:**
  * Returns top-level `citations: string[]` (array of resolved URLs).
  * Does NOT provide native page titles or fine-grained text offset attributions in the base response (requires client-side HTML parsing to resolve titles).
* **Free Tier:** None for API access. Requires prepaid credit balance.

---

### C. OpenAI API (Web Search Tool)

* **Primary Official Source:** [openai.com/api/pricing](https://openai.com/api/pricing), [developers.openai.com](https://developers.openai.com)
* **Current Model Ecosystem (Verified September 2026):**
  * Core models include the **GPT-6 Astra** family and **GPT-5.6** (Sol, Terra, Luna), alongside `gpt-4o` and reasoning models.
* **Web Search Architecture & Tool Fees:**
  * Web search is billed as a tool invocation on top of base model token rates.
  * **Standard Web Search Tool Fee:** **$10.00 per 1,000 calls** ($0.01 per search call).
  * **Search Content Tokens:** Web pages fetched during search are injected into model context and billed at the model's standard input token rate.
  * *Note:* Retrieved content typically adds 2,000 to 5,000 input tokens per query, making total query cost variable ($0.015 to $0.035+ per prompt).
* **Citation Quality:** Generates markdown-style URLs or tool output citation objects.
* **Free Tier:** None for web search tool calls.

---

### D. Anthropic Claude API

* **Primary Official Source:** [docs.anthropic.com](https://docs.anthropic.com)
* **Status:** Anthropic does not provide a first-party native live web search tool within standard Claude API endpoints.
* **Evaluation:** Requires building custom tool-use loops integrated with third-party search APIs (e.g. Brave, Tavily, Bing), incurring double API fees and high latency. Deferred for future multi-model expansion.

---

## 3. Audited Comparative Matrix

| Dimension | Google Gemini 3.8 Flash | Perplexity Sonar (Agent API) | OpenAI (Web Search Tool) |
| :--- | :--- | :--- | :--- |
| **Model Evaluated** | `gemini-3.8-flash` | `sonar` (Agent API) | `gpt-4o-mini` / `gpt-5.6-sol` |
| **Input Token Rate (/1M)** | $0.75 | $1.00 | $0.15 ? $1.50 |
| **Output Token Rate (/1M)** | $3.75 | $1.00 | $0.60 ? $6.00 |
| **Search Request Fee** | $14.00 / 1k queries | $5.00 / 1k requests | $10.00 / 1k calls + content tokens |
| **Free Developer Tier** | **5,000 search queries / month** | None ($0 balance rejects) | None |
| **Citation Granularity** | High (URLs, Titles, Sentence Offsets) | Moderate (URLs array, inline `[1]`) | Moderate (Markdown URLs) |
| **API Lifecycle Risk** | Stable (Official SDK & API) | Breaking change on Sept 27, 2026 | Stable (Responses API) |

---

## 4. Re-Evaluated MVP Provider Selection

### **Selected MVP Provider: Google Gemini 3.8 Flash (Grounding with Google Search)**

#### Documented Reasons for Selection:
1. **5,000 Free Search Queries Monthly:** Allows us to execute up to 1,000 free 5-question scans every month with zero search grounding fees, drastically lowering initial developer and MVP operational costs.
2. **Superior Citation Fidelity for "Why" Engine:** Gemini's `groundingMetadata` supplies page titles and sentence-level claim offsets (`groundingSupports`). This directly powers our **Citation Analysis** and **AI Claim vs. Website Evidence** engine without needing secondary scraping.
3. **API Stability:** Perplexity is deprecating its Chat Completions API on September 27, 2026, introducing migration risks. Gemini's grounding tool interface is stable and well-supported in `@google/generative-ai`.
4. **Architectural Isolation:** The provider interface remains completely abstract (`src/providers/types.ts`). Perplexity Sonar and OpenAI Web Search will be added to the registry as secondary adapters once the core pipeline is validated.
