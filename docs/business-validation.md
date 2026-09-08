# Business Validation & Go-To-Market Strategy

**Product:** Does AI Recommend You?  
**Document Status:** Complete (Phase 0)  
**Date:** September 2026  

---

## 1. Core Hypothesis

> **Hypothesis:** B2B SaaS founders, e-commerce merchants, and digital agency operators recognize that AI conversational search is rapidly siphoning high-intent buyer traffic away from traditional search engines. They urgently need to know whether AI systems recommend their brand for commercial purchase queries, why competitors are recommended instead, and what specific steps will make their product more recommendable.

---

## 2. Target Buyer Personas

### A. The SaaS Founder / VP of Growth (Primary Beachhead)
* **Company Profile:** B2B SaaS, $500k?$10M ARR, 10?100 employees.
* **Core Trigger:** Seeing competitors like Notion, HubSpot, or Linear constantly cited in ChatGPT and Perplexity recommendations while their own tool is missing.
* **Willingness to Pay:** High ($49?$199/month). Marketing budgets are already allocated to SEO and PPC; allocating a fraction to "AI Search Visibility" is an easy internal sell.
* **Desired Outcome:** Discover the exact prompts where competitors are winning, understand the missing content or third-party review presence, and gain visibility in LLM buyer roundups.

### B. The Performance / SEO Agency Lead (Scale Partner)
* **Company Profile:** Boutique digital marketing and SEO agencies managing 10?50 client accounts.
* **Core Trigger:** Clients asking: *"Why aren't we showing up in ChatGPT or Gemini search?"*
* **Willingness to Pay:** Very High ($99?$499/month). They can repackage GEO audits and ongoing monitoring reports to justify recurring agency retainers.
* **Desired Outcome:** Automated client audits, white-labeled reporting, and actionable recommendations they can bill their clients to implement.

### C. The E-Commerce Brand Director
* **Company Profile:** D2C brand selling specialized consumer goods ($1M?$20M GMV).
* **Core Trigger:** Emergence of Google Merchant Center AI Performance insights, ChatGPT shopping, and conversational product discovery.
* **Willingness to Pay:** Moderate to High ($49?$99/month).
* **Desired Outcome:** Ensure their catalog and product features appear when shoppers ask "What is the best [product category] for [use case]?".

---

## 3. The Unfair Acquisition Flywheel

We do NOT rely on paid ads. The product is engineered with a viral organic acquisition loop:

```text
Visitor arrives at landing page
               |
Instant Free Scan (URL input, < 30 seconds, NO LOGIN REQUIRED)
               |
"Aha! Magic Moment": Visually stunning, shareable AI Recommendation Report
               |
Visitor shares report card on X / LinkedIn ("AI recommended our competitor instead of us!")
               |
Colleagues and peer founders run their own scans
               |
CTA: "Track this every week and get notified when AI changes its recommendation"
               |
Self-serve SaaS Signup & Paid Subscription
```

### Key Acquisition Channels:
1. **Frictionless Free Checker:** Instant value before asking for user information.
2. **Shareable Report Cards (`/report/[id]`):** High-contrast, clean summary images formatted for social feeds with one-click sharing.
3. **Data-Led Organic Content & Benchmarks:**
   * "We tested 500 SaaS companies across AI search ? here is what we found."
   * "Which CRM tools does ChatGPT actually recommend in 2026?"
   * Published datasets established on real measured results, never fabricated.

---

## 4. Monetization Tiers (Hypothesis for Validation)

* **Free:**
  * 1 free live scan per domain (5 tailored buyer questions).
  * Single provider analysis.
  * Basic competitor & citation overview.
  * Instant prescriptive action summary.
* **Starter ($29 / month):**
  * Weekly automated tracking (15 custom prompts).
  * Multi-provider coverage (Gemini, Perplexity, ChatGPT).
  * Email alerts when recommendation status changes.
  * 30-day historical trend graph.
* **Growth ($79 / month):**
  * Daily tracking (50 prompts).
  * Deep citation gap analysis & publisher intelligence.
  * AI claim vs. website evidence verification.
  * CSV/PDF exports.
* **Agency ($199 / month):**
  * 15 client projects included.
  * White-label client portal and branded PDF reporting.
  * Shared seats and client access links.

---

## 5. Critical Business & Market Risks

| Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Provider Instability & Cost Escalation** | High | Provider abstraction; server-side caching; strict query limits on free scans; fallback providers. |
| **AI Stochasticity (Non-deterministic answers)** | Medium | Aggregate multi-query runs; calculate consistency scores; transparently explain variance to users. |
| **Attribution Skepticism ("Does GEO work?")** | High | Focus on **Observability & Evidence**. Never guarantee #1 rankings; focus on verified citations, review platform coverage, and factual clarity. |
| **Crowded GEO Tool Landscape** | Medium | Avoid generic enterprise dashboard clutter. Own the "Simple, Actionable, Prescriptive" positioning. |

---

## 6. MVP Success Criteria & Validation Gates

We will not measure success by lines of code written or features deployed. Success is defined by customer behavior:

* **Gate 1 (Traffic to Scan Conversion):** > 35% of visitors to the landing page enter a URL and run a scan.
* **Gate 2 (Magic Moment):** > 50% of users who scan view their full report and scroll through the recommendation breakdown.
* **Gate 3 (Acquisition & Intent):** First 100 free scans executed -> 20 email signups to save/monitor their domain -> 5 early customer discovery interviews or pre-subscribers.
