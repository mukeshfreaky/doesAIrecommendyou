# Cost Model & Unit Economics

**Product:** Does AI Recommend You?  
**Document Status:** Complete (Phase 0)  
**Date:** September 2026  

---

## 1. Executive Summary

AI-powered SaaS products can suffer from negative unit economics if AI querying costs are not strictly modeled, tracked, and capped from Day 1. In *Does AI Recommend You?*, every free and paid scan has a deterministic cost envelope.

This document answers the critical operational question:

> **"How much does one scan cost us, and how do we prevent API exhaustion?"**

---

## 2. Unit Economics per 5-Question Scan

A standard MVP scan evaluates **5 high-intent buyer questions** against a search-grounded AI provider.

### A. Google Gemini 2.0 Flash (Initial Launch Provider)

| Cost Component | Developer / Free Tier | Paid Production Tier |
| :--- | :--- | :--- |
| **Search Grounding Queries** | Included in 1,500 req/day quota ($0.00) | $14.00 per 1,000 search queries = **$0.014 per question** |
| **Input Tokens (~300 tokens / q)** | Included ($0.00) | $0.075 / 1M tokens = **$0.0000225** |
| **Output Tokens (~400 tokens / q)** | Included ($0.00) | $0.30 / 1M tokens = **$0.00012** |
| **Cost per Question** | **$0.00** | **~$0.0141** |
| **Total Cost per 5-Question Scan** | **$0.00 (Up to 300 scans/day)** | **~$0.0707 (~7.1 cents)** |

*Observation: By utilizing Gemini's generous 1,500 daily free request quota, our initial 300 free user scans per day cost $0.00 in provider fees.*

### B. Perplexity API (Sonar - Extension Provider)

| Cost Component | Rate | Per 5-Question Scan |
| :--- | :--- | :--- |
| **Flat Search Request Fee** | $5.00 per 1,000 requests | 5 x $0.0050 = **$0.0250** |
| **Input Tokens (~250 tokens / q)** | $1.00 / 1M tokens | 1,250 tokens = **$0.00125** |
| **Output Tokens (~350 tokens / q)** | $1.00 / 1M tokens | 1,750 tokens = **$0.00175** |
| **Total Cost per 5-Question Scan** | ? | **~$0.0280 (~2.8 cents)** |

### C. OpenAI API (gpt-4o-mini with Web Search - Extension Provider)

| Cost Component | Rate | Per 5-Question Scan |
| :--- | :--- | :--- |
| **Web Search Tool Call Fee** | $25.00 per 1,000 calls | 5 x $0.0250 = **$0.1250** |
| **Retrieved Search Content Tokens** | $0.15 / 1M input tokens (~2.5k tokens/q) | 12,500 tokens = **$0.00188** |
| **Output Tokens (~400 tokens / q)** | $0.60 / 1M output tokens | 2,000 tokens = **$0.00120** |
| **Total Cost per 5-Question Scan** | ? | **~$0.1281 (~12.8 cents)** |

---

## 3. Margin & Conversion Model (Free-to-Paid)

* **Hypothesis:** 100 free scans yield 5 paying Starter subscribers ($29/month).
* **Cost to Generate 100 Free Scans:**
  * Free quota: **$0.00**
  * Paid production tier (Gemini): 100 scans x $0.071 = **$7.10**
* **Revenue from 5 Conversions:** 5 x $29.00 = **$145.00 / month**
* **Customer Acquisition Cost (COGS only):** ~$1.42 per paying user.
* **Gross Margin on Paid Subscriptions:** > 88% (even with weekly automated monitoring of 20 prompts).

---

## 4. Cost Control, Rate Limiting & Abuse Prevention

To protect against Denial-of-Wallet attacks and bot scrapers:

1. **Deterministic Scan Caching (24-Hour TTL):**
   * Before issuing external AI queries, the system checks whether the domain has been scanned within the past 24 hours.
   * If cached, the existing report is served instantly with a clear timestamp: *"Last analyzed: [Date/Time]"*.
   * Caching reduces redundant API calls by an estimated 40?60%.
2. **IP Rate Limiting:**
   * Anonymous free users are limited to **3 scans per IP per 24 hours**.
   * Excess attempts receive an HTTP 429 status with a courteous rate-limit message.
3. **Domain Frequency Cap:**
   * The same root domain cannot be scanned more than once every 12 hours on the free tier.
4. **Token Usage Telemetry (`src/providers/types.ts`):**
   * Every query records:
     * `provider`: string
     * `model`: string
     * `promptCount`: number
     * `inputTokens`: number
     * `outputTokens`: number
     * `estimatedCostUSD`: number
     * `timestamp`: ISO timestamp
