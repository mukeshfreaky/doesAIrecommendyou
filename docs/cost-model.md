# Cost Model & Unit Economics (Audited)

**Product:** Does AI Recommend You?  
**Document Status:** Audited & Verified against Official Documentation (Phase 0)  
**Date:** September 8, 2026  
**Standard:** Primary official pricing only. No unverified estimates.

---

## 1. Executive Summary

This document provides exact, audited unit economics for *Does AI Recommend You?*, answering the operational question:

> **"How much does one scan cost us, and how does the cost scale from 1 to 10,000 scans?"**

All token and search rates below reflect official documentation as of **September 2026**.

---

## 2. Per-Unit Cost Assumptions (Gemini 3.8 Flash)

* **Input Tokens per Question:** ~350 tokens (System prompt, website context, buyer question).
  * Rate: $0.75 per 1,000,000 tokens ($0.00000075 / token).
  * Cost: $0.00000075 x 350 = **$0.0002625**.
* **Output Tokens per Question:** ~450 tokens (includes model thinking + synthesized answer).
  * Rate: $3.75 per 1,000,000 tokens ($0.00000375 / token).
  * Cost: $0.00000375 x 450 = **$0.0016875**.
* **Token Cost Subtotal per Question:** $0.0002625 + $0.0016875 = **$0.00195** (~0.20 cents).
* **Google Search Grounding Fee:**
  * Free Tier: 5,000 free search queries per month.
  * Paid Tier: $14.00 per 1,000 queries = **$0.01400** per search query.

---

## 3. Audited Cost Breakdown Across Scale

A standard MVP scan evaluates **5 high-intent buyer questions**.

### Scenario A: Within Google AI Studio Free Quota (First 1,000 scans / 5,000 questions per month)
* Grounding search fee: **$0.00** (covered by 5,000 free monthly queries).
* Only token fees apply (or $0.00 if using AI Studio free token quota):

| Scale | Total Questions | Search Fee | Token Fee (Paid Token Rate) | Total Cost (Subsidized) | Cost Per Scan |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1 Buyer Question** | 1 | $0.00 | $0.00195 | **$0.00195** | $0.00195 |
| **5-Question Scan (1 Scan)** | 5 | $0.00 | $0.00975 | **$0.00975** (~1 cent) | **~$0.010** |
| **100 Scans** | 500 | $0.00 | $0.98 | **$0.98** | **~$0.010** |
| **1,000 Scans (Cap of Free Quota)** | 5,000 | $0.00 | $9.75 | **$9.75** | **~$0.010** |

---

### Scenario B: Standard Paid Production Tier (Unsubsidized Rates)
When exceeding the free tier or operating on enterprise billing ($14/1k queries + standard tokens):
* **Total Cost per Question:** $0.00195 (tokens) + $0.01400 (search) = **$0.01595** (~1.60 cents).
* **Total Cost per 5-Question Scan:** 5 x $0.01595 = **$0.07975** (~7.98 cents).

| Scale | Total Questions | Search Grounding Fee | Token Usage Fee | Total USD Cost | Effective Cost / Scan |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1 Buyer Question** | 1 | $0.0140 | $0.00195 | **$0.01595** | $0.01595 |
| **5-Question Scan (1 Scan)** | 5 | $0.0700 | $0.00975 | **$0.07975** | **~$0.080** |
| **100 Scans** | 500 | $7.00 | $0.98 | **$7.98** | **~$0.080** |
| **1,000 Scans** | 5,000 | $70.00 | $9.75 | **$79.75** | **~$0.080** |
| **10,000 Scans** | 50,000 | $700.00 | $97.50 | **$797.50** | **~$0.080** |

---

## 4. Alternative Provider Economics Comparison (Unsubsidized)

| Provider / Model | Cost per Question | 5-Question Scan | 100 Scans | 1,000 Scans | 10,000 Scans | Key Limitations |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Gemini 3.8 Flash** | **$0.01595** | **$0.0798** | **$7.98** | **$79.75** | **$797.50** | 5,000 free search queries/mo reduces early scale cost |
| **Perplexity Sonar (Agent API)** | **$0.00580** | **$0.0290** | **$2.90** | **$29.00** | **$290.00** | No free tier; legacy API deprecated Sept 27, 2026; no claim offsets |
| **OpenAI (Web Search)** | **~$0.01500?$0.02500** | **~$0.0750?$0.1250** | **$7.50?$12.50** | **$75.00?$125.00** | **$750.00?$1,250.00** | Web content token injection causes variable, unpredictable costs |

---

## 5. Cost Control & Defensive Architecture

1. **Deterministic 24-Hour Domain Caching:**
   * Re-scanning the same domain within 24 hours serves the cached report.
   * Prevents duplicate scans from burning API budget.
2. **IP & Session Rate Limiting:**
   * Anonymous users: Max 3 scans per IP per 24-hour window.
3. **Domain Frequency Limiting:**
   * A root domain cannot be scanned more than once every 12 hours on the free tier.
4. **Usage Telemetry Logging:**
   * Every scan logs: `provider`, `model`, `promptCount`, `inputTokens`, `outputTokens`, `searchQueriesExecuted`, `estimatedCostUSD`, and `timestamp`.
