# Cost Model & Unit Economics (Audited)

**Product:** Does AI Recommend You?  
**Document Status:** Audited & Verified against Official Documentation (Phase 0)  
**Date:** September 8, 2026  
**Standard:** Primary official pricing only. Models search query variance (1.0x, 1.5x, 2.0x).

---

## 1. Executive Summary

This document provides exact, audited unit economics for *Does AI Recommend You?*, answering the operational question:

> **"How much does one scan cost us, and how does cost scale from 1 to 10,000 scans under real-world search query variance?"**

All token and search rates below reflect official Google documentation as of **September 2026**.

---

## 2. Per-Unit Cost Assumptions (Gemini 3.8 Flash / 2.5 Flash)

* **Input Tokens per Question:** ~350 tokens (System prompt, website context, buyer question).
  * Rate: $0.75 per 1,000,000 tokens ($0.00000075 / token).
  * Cost: $0.00000075 x 350 = **$0.0002625**.
* **Output Tokens per Question:** ~450 tokens (includes model thinking + synthesized answer).
  * Rate: $3.75 per 1,000,000 tokens ($0.00000375 / token).
  * Cost: $0.00000375 x 450 = **$0.0016875**.
* **Base Token Cost Subtotal per Question:** $0.0002625 + $0.0016875 = **$0.00195** (~0.20 cents).
* **Token Cost per 5-Question Scan:** 5 x $0.00195 = **$0.00975** (~0.98 cents).

### Google Search Grounding Rates
* **Free Tier Quota:** 5,000 free search queries per month (shared across 3.x models in Google AI Studio).
* **Paid Tier Search Fee:** $14.00 per 1,000 search queries = **$0.01400** per search query.

---

## 3. Search Query Multiplier Scenarios (Uncertainty Modeling)

A single prompt sent to Gemini with Search Grounding may trigger **1.0 to 2.0 actual search queries** depending on the complexity of the category and ambiguity of the prompt. Therefore, costs cannot be assumed to be a fixed $0.08 per scan.

We model three operational scenarios:
* **Scenario A (1.0x Queries / Question - Best Case):** 1 search query per buyer question = 5 search queries per scan.
* **Scenario B (1.5x Queries / Question - Expected Average):** Some questions trigger a secondary clarifying query = 7.5 effective search queries per scan.
* **Scenario C (2.0x Queries / Question - Stress Case):** Complex comparative queries trigger 2 searches = 10 search queries per scan.

---

## 4. Cost Scaling: 1 to 10,000 Scans (Unsubsidized Production Rates)

*Note: The existing ~$0.07975 figure represents the **1.0 search query per question baseline scenario**. It is NOT a guaranteed exact production cost.*

### Breakdown for a Single 5-Question Scan ($0.00975 tokens + search):
* **1.0x Queries:** Search = $0.0700 | Tokens = $0.00975 | **Total = $0.07975 (~$0.080)**
* **1.5x Queries:** Search = $0.1050 | Tokens = $0.00975 | **Total = $0.11475 (~$0.115)**
* **2.0x Queries:** Search = $0.1400 | Tokens = $0.00975 | **Total = $0.14975 (~$0.150)**

### Scaling Table Across Query Intensities (Paid Production Tier)

| Scale | Total Questions | 1.0x Scenario (5 queries/scan) | 1.5x Scenario (7.5 queries/scan) | 2.0x Scenario (10 queries/scan) |
| :--- | :--- | :--- | :--- | :--- |
| **1 Buyer Question** | 1 | $0.0160 | $0.0230 | $0.0300 |
| **5-Question Scan** | 5 | **$0.0798 (~$0.08)** | **$0.1148 (~$0.11)** | **$0.1498 (~$0.15)** |
| **100 Scans** | 500 | **$7.98** ($7.00 search + $0.98 tok) | **$11.48** ($10.50 search + $0.98 tok) | **$14.98** ($14.00 search + $0.98 tok) |
| **1,000 Scans** | 5,000 | **$79.75** ($70.00 search + $9.75 tok) | **$114.75** ($105.00 search + $9.75 tok) | **$149.75** ($140.00 search + $9.75 tok) |
| **10,000 Scans** | 50,000 | **$797.50** ($700 search + $97.50 tok) | **$1,147.50** ($1,050 search + $97.50 tok) | **$1,497.50** ($1,400 search + $97.50 tok) |

---

## 5. Free-Tier Subsidized Economics (First 1,000 Scans/Month)

Under Google AI Studio's 5,000 free search queries per month:
* At 1.0x queries/question: Up to **1,000 scans** have **$0.00 search fees** (Total cost = $9.75 token cost only).
* At 1.5x queries/question: Up to **666 scans** covered by free search quota.
* At 2.0x queries/question: Up to **500 scans** covered by free search quota.

---

## 6. Defensive Cost Controls

1. **Deterministic 24-Hour Domain Caching:** Serving cached reports for duplicate scans reduces external queries by an estimated 40?60%.
2. **IP Rate Limiting:** 3 scans per IP per 24 hours for anonymous users.
3. **Domain Frequency Cap:** 1 scan per domain per 12 hours on public tier.
4. **Telemetry Logging:** Every scan captures: `provider`, `model`, `promptCount`, `inputTokens`, `outputTokens`, `searchQueriesExecuted`, and `estimatedCostUSD`.
