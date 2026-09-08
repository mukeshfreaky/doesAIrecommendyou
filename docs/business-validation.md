# Business Validation & Hypotheses (Audited)

**Product:** Does AI Recommend You?  
**Document Status:** Audited (Phase 0)  
**Date:** September 8, 2026  
**Standard:** All forward-looking commercial assumptions are explicitly labeled as **[UNVALIDATED HYPOTHESIS]**.

---

## 1. Core Problem & Value Hypotheses

### Primary Strategic Hypothesis [UNVALIDATED HYPOTHESIS]
> B2B SaaS founders, e-commerce merchants, and digital agency operators recognize that AI conversational search is rapidly siphoning high-intent buyer traffic away from traditional search engines. They urgently need to know whether AI systems recommend their brand for commercial purchase queries, why competitors are recommended instead, and what specific steps will make their product more recommendable.

### Problem Urgency Hypotheses [UNVALIDATED HYPOTHESIS]
* Buyers are increasingly asking conversational AI engines ("What CRM should I use?") rather than browsing multiple Google search pages.
* Marketers currently lack visibility into how LLM answers are synthesized and which sources determine recommendation outcomes.
* Existing tools deliver complex rank-tracking dashboards, but fail to provide actionable playbooks for becoming more recommendable.

---

## 2. Target Buyer Personas (Hypothetical Profiles)

### A. The B2B SaaS Growth Lead [UNVALIDATED HYPOTHESIS]
* **Profile:** Seed to Series B B2B SaaS founders and heads of growth ($500k?$10M ARR).
* **Hypothetical Pain Point:** Competitors are consistently cited in ChatGPT / Gemini buyer lists, causing pipeline loss.
* **Hypothetical Willingness to Pay:** $49?$199/month, sourced from existing SEO or experimental marketing budgets.

### B. The Boutique Digital Marketing / SEO Agency [UNVALIDATED HYPOTHESIS]
* **Profile:** Digital marketing and SEO agencies with 10?50 client accounts.
* **Hypothetical Pain Point:** Clients demanding answers regarding AI search visibility.
* **Hypothetical Willingness to Pay:** $99?$499/month for automated audits, white-label client reports, and repeatable deliverables.

### C. The E-Commerce / D2C Merchant [UNVALIDATED HYPOTHESIS]
* **Profile:** D2C brand directors navigating conversational commerce and Google Merchant Center AI features.
* **Hypothetical Willingness to Pay:** $49?$99/month.

---

## 3. Acquisition Flywheel Hypotheses [UNVALIDATED HYPOTHESIS]

```text
Visitor arrives at landing page
               |
Instant Free Scan (URL input, < 30 seconds, NO LOGIN REQUIRED)
               |
"Aha! Magic Moment": Visually compelling, shareable AI Recommendation Report
               |
Visitor shares report card on X / LinkedIn ("AI recommended our competitor!")
               |
Peers run their own scans via shared report links
               |
CTA: "Track this every week and get notified when recommendations change"
               |
Self-serve SaaS Signup & Paid Subscription
```

* **Conversion Rate Hypothesis 1 [UNVALIDATED]:** > 35% of landing page visitors will input a URL and run a scan.
* **Conversion Rate Hypothesis 2 [UNVALIDATED]:** > 50% of users who initiate a scan will explore their detailed question breakdown.
* **Conversion Rate Hypothesis 3 [UNVALIDATED]:** 3?5% of free scan viewers will convert to a paid weekly monitoring subscription ($29/mo).

---

## 4. Proposed Pricing Structure (Subject to User Testing)

* **Free Tier:** 1 free live scan per domain (5 tailored buyer questions, single provider analysis, basic competitor and citation overview).
* **Starter Tier ($29/month) [HYPOTHETICAL]:** Weekly automated tracking of 15 prompts, email alert on recommendation posture change.
* **Growth Tier ($79/month) [HYPOTHETICAL]:** Daily monitoring of 50 prompts, deep citation gap analysis, claim verification.
* **Agency Tier ($199/month) [HYPOTHETICAL]:** 15 client projects, white-label exports, shared client report links.

---

## 5. Critical Business & Market Risks

| Risk | Severity | Nature | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Provider Pricing / Terms Volatility** | High | Operational | Maintain strict provider abstraction (`AIProvider`); use server-side caching; enforce strict query rate limits. |
| **AI Answer Stochasticity** | Medium | Technical | Aggregate multi-query runs; calculate confidence scores; transparently communicate variance to users. |
| **Weak ROI / Unclear Attribution** | High | Commercial | Focus on **Observability and Evidence**. Never promise #1 rankings; focus on factual clarity, comparison coverage, and third-party consensus. |
| **Competitive Crowding in GEO** | Medium | Market | Differentiate through radical simplicity, 30-second time-to-value (no login wall), and prescriptive playbooks. |

---

## 6. Phase 0 Validation Criteria

We will not declare validation until observed customer behavior supports these hypotheses:
1. **100 real website scans** completed by target founders or marketers.
2. **20 user signups** expressing interest in ongoing monitoring.
3. **5 paying beta customers** or qualitative willingness-to-pay commitments.
