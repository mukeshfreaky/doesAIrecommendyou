# Provider Feasibility & Technical Research

**Product:** Does AI Recommend You?  
**Document Status:** Complete (Phase 0)  
**Date:** September 2026  

---

## 1. Executive Summary

To answer *"Does AI recommend your business?"*, the system queries frontier AI models with conversational buyer prompts and evaluates how brands are presented. 

Because we hold an absolute product ethic: **NEVER FAKE AI RESULTS**, we rely exclusively on legal, documented, developer-grade APIs. We strictly prohibit scraping consumer interfaces (chatgpt.com, perplexity.ai, gemini.google.com), bypassing CAPTCHAs, or fabricating citation data.

This document evaluates the four leading AI platforms across:
1. Native web search / search grounding support.
2. Citation extraction fidelity (URLs, source titles, snippet grounding).
3. API stability and latency.
4. Token economics and per-query costs.
5. Terms of Service compliance and legal considerations.

---

## 2. In-Depth Provider Evaluation

### A. Google Gemini API (Grounding with Google Search)

* **Model Family:** Gemini 2.0 Flash (`gemini-2.0-flash`) and Gemini 1.5 Flash (`gemini-1.5-flash`).
* **Web Grounding Architecture:**
  * Supported natively via the `google_search` tool (`tools: [{ googleSearch: {} }]`).
  * When enabled, the model autonomously determines if live web information is needed, executes one or more real Google web searches, synthesizes the answer, and links statements to specific web sources.
* **Citation & Metadata Quality:**
  * Returns a structured `groundingMetadata` payload containing:
    * `webSearchQueries`: The exact search queries Gemini executed to formulate the answer.
    * `groundingChunks`: Array of web sources with exact URLs (`uri`) and page titles (`title`).
    * `groundingSupports`: Fine-grained character-offset mappings connecting generated claims to specific source indices.
* **Pricing & Quotas:**
  * **Free Tier:** 1,500 requests per day (free of charge in Google AI Studio).
  * **Paid Tier:** $14 to $35 per 1,000 search queries + standard Flash token rates ($0.075 / 1M input tokens, $0.30 / 1M output tokens).
* **Latency:** Extremely fast (typically 1.5?3.2 seconds for grounded queries on Gemini 2.0 Flash).
* **Legal & Terms:** Fully compliant with Google Generative AI API Terms of Service. Designed specifically for enterprise search integration.

### B. Perplexity API (Sonar Models)

* **Model Family:** `sonar` (lightweight / 8B parameters) and `sonar-pro` (large / 70B parameters).
* **Web Grounding Architecture:**
  * Search is natively baked into the Sonar pipeline. Every query automatically queries Perplexity's internal search index and web crawlers.
* **Citation & Metadata Quality:**
  * Returns a top-level `citations: string[]` array containing resolved web URLs cited in the response text using bracket notation (e.g. `[1]`, `[2]`).
  * Does not provide fine-grained character offsets or source titles natively in standard JSON (requires HTML/meta scraping of the URLs to extract titles).
* **Pricing & Quotas:**
  * `sonar`: $1.00 / 1M input tokens, $1.00 / 1M output tokens + **$5.00 flat search request fee per 1,000 requests**.
  * `sonar-pro`: $3.00 / 1M input tokens, $15.00 / 1M output tokens + **$5.00 search fee per 1,000 requests**.
  * No free tier for automated API testing; requires prepaid credit balance.
* **Latency:** Moderate (2.5?5.0 seconds).
* **Legal & Terms:** Permitted under Perplexity API Developer Agreement.

### C. OpenAI API (Responses API with Web Search Tool)

* **Model Family:** `gpt-4o` and `gpt-4o-mini` with `web_search` tool.
* **Web Grounding Architecture:**
  * The model issues explicit tool calls to search the web and inspect retrieved pages.
* **Citation & Metadata Quality:**
  * Generates URLs in markdown references or message tool outputs.
* **Pricing & Quotas:**
  * **Tool Call Fees:** $25.00 per 1,000 search calls for non-reasoning models ($10.00 / 1k for reasoning models).
  * **Retrieved Content Tokens:** Web pages fetched during search are injected into context and billed as standard input tokens, which can rapidly increase token consumption (often 2,000?6,000 tokens per search).
  * Total cost per grounded query is high ($0.03?$0.08 per prompt).
* **Latency:** High (4.0?9.0 seconds due to multi-turn tool execution loops).
* **Legal & Terms:** Compliant with OpenAI Developer Policy.

### D. Anthropic Claude API (Claude 3.5 Sonnet / 3.5 Haiku)

* **Model Family:** `claude-3-5-sonnet`, `claude-3-5-haiku`.
* **Web Grounding Architecture:**
  * Anthropic does not currently provide a native, managed live web search tool within standard Claude API endpoints.
  * To ground Claude responses, developers must implement custom Retrieval-Augmented Generation (RAG) by integrating external search engines (e.g., Tavily, Brave Search, or Bing Web Search API).
* **Evaluation:** High implementation complexity and double-billing (paying search engine API + Anthropic API). Deferred for Phase 2/3.

---

## 3. Comparative Summary Table

| Evaluation Criterion | Google Gemini 2.0 Flash | Perplexity Sonar | OpenAI (Web Search) | Anthropic Claude |
| :--- | :--- | :--- | :--- | :--- |
| **Native Web Search** | Yes (`googleSearch` tool) | Yes (Default in Sonar) | Yes (`web_search` tool) | No (Requires custom RAG) |
| **Citation Precision** | Outstanding (URLs, titles, claim spans) | High (URLs array, inline `[1]`) | Good (Markdown URLs) | Dependent on external search |
| **Cost per 1,000 Scans** | ~$0 (Free tier) / ~$14?$35 | ~$6?$8 | ~$25?$80 | Variable (High) |
| **Average Latency** | 1.8 ? 2.8s | 3.0 ? 4.5s | 4.5 ? 8.0s | N/A |
| **Free Developer Tier** | 1,500 requests/day | None ($0 balance = fails) | None | None |
| **Stability & Uptime** | 99.9% (Google Cloud SLA) | Moderate | High | High |
| **Risk of Scraping Ban** | 0% (Official API) | 0% (Official API) | 0% (Official API) | 0% (Official API) |

---

## 4. Provider Selection for Initial Implementation

### **Selected Provider: Google Gemini 2.0 Flash (with Search Grounding)**

### Rationale:
1. **Unmatched Citation Granularity:** Gemini's `groundingMetadata` does not just return raw URLs; it returns the exact page titles, web search queries executed, and precise claim mappings (`groundingSupports`). This directly fuels our **Citation / Source Analysis** and **AI Claim vs. Website Evidence** engines.
2. **Superior Cost-Efficiency:** The 1,500 requests/day free quota under Google AI Studio allows us to build, test, and offer free scans to early users with **zero infrastructure API cost**. On paid tiers, Flash token costs are a fraction of GPT-4o or Sonar Pro.
3. **Speed & UX:** Gemini 2.0 Flash has the fastest time-to-first-token and complete response generation among all web-grounded models, keeping the free user report generation time under 10 seconds for a full 5-question scan.
4. **Clean Abstraction Compatibility:** The architecture will isolate the provider behind a standard `AIProvider` interface. Perplexity and OpenAI adapters will be implemented immediately thereafter as pluggable modules.

---

## 5. Security & Crawler Best Practices

### A. SSRF (Server-Side Request Forgery) Protection
When the user enters a website URL (e.g. `example.com`), our server fetches the page to extract metadata. We must prevent malicious users from targeting internal services or cloud metadata.
* **Prohibited IP Ranges:**
  * `127.0.0.0/8` (Loopback / Localhost)
  * `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` (Private RFC 1918)
  * `169.254.169.254` (AWS / GCP / Cloud metadata services)
  * `::1`, `fe80::/10`, `fc00::/7` (IPv6 loopback and unique local)
* **Domain & Protocol Restrictions:**
  * Only `http:` and `https:` protocols allowed.
  * DNS resolution before fetch to verify IP is public.
  * Maximum redirect hops: 3. Redirects re-validated against SSRF filters.
* **Resource Limits:**
  * Connection timeout: 5,000ms.
  * Response body limit: 1.5MB (stream truncated immediately to prevent memory exhaustion).
  * User-Agent clearly identifies scanner (`DoesAIRecommendYouBot/1.0 (+https://doesairecommendyou.com/bot)`).

### B. Provider API Key Security
* Provider keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `PERPLEXITY_API_KEY`) are strictly server-side environment variables (`.env.local`).
* Never exposed in client-side bundles or network payloads.
* If a key is missing on the server, the application presents a clear administrative configuration notice rather than prompting anonymous web visitors for credentials.
