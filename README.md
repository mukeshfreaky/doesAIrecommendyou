# Does AI Recommend You?

> **Find out whether ChatGPT, Gemini, and other AI systems recommend your business — and discover how to become more recommendable.**

Status: **MVP / Phase 0 Complete**

---

## 1. Overview

**Does AI Recommend You?** is a SaaS platform designed for modern founders, growth marketers, and agencies navigating AI-mediated discovery. As buyers migrate from traditional search engines to conversational answer engines (ChatGPT, Google Gemini, Perplexity), winning organic recommendations is the new frontier.

Unlike generic "AI SEO" dashboards that output abstract sentiment scores, **Does AI Recommend You?** is built around one simple question:

> **"When high-intent customers ask AI for recommendations in your category, does AI recommend you or your competitor?"**

### Core Philosophy
* **Radical Simplicity:** Enter a website URL -> receive an actionable visibility report in under 30 seconds.
* **Never Fake Data:** Every scan queries real, live, search-grounded AI providers via official APIs. We never simulate or fabricate AI responses.
* **Evidence vs. Inference Discipline:** We clearly separate **Observed Evidence** (what the AI actually said and cited) from **Inference** (why this occurred) and **Action** (concrete steps to improve).
* **Actionable & Prescriptive:** We don't just measure your score; we provide the exact playbooks to help your business become more recommendable.

---

## 2. Technology Stack & Architecture

Built as a clean TypeScript modular monolith:
* **Frontend / Framework:** Next.js 15 (App Router), React 19, TypeScript
* **Styling:** Tailwind CSS, Lucide Icons
* **Crawler & Evidence Collector:** Node.js native fetch with strict SSRF protection (IP filtering, private network blocking, 1.5MB stream limits)
* **Buyer Intent Taxonomy:** 11-category buyer intent generator synthesizing realistic commercial prompts
* **Provider Abstraction Layer:** Modular adapter interface supporting Google Gemini 2.0 Flash (with Search Grounding), Perplexity Sonar, and OpenAI Web Search
* **Analysis Engine:** Deterministic 5-tier recommendation posture classification (`TOP_RECOMMENDATION`, `RECOMMENDED`, `CONSIDERED`, `MENTIONED`, `NOT_MENTIONED`), competitor displacement mapping, citation categorization, and transparent scoring
* **Testing:** Vitest unit and integration test suites

---

## 3. Project Structure

```text
does-ai-recommend-you/
+-- docs/                      # Core architectural & strategic documentation
¦   +-- competitive-analysis.md # Breakdown of PromptMonitor, Profound, Otterly, etc.
¦   +-- research.md            # Provider grounding, citation quality & API feasibility
¦   +-- business-validation.md # Buyer personas, GTM loop, monetization & risks
¦   +-- architecture.md        # Modular monolith system design & security model
¦   +-- scoring-methodology.md # Mathematical formulation of Recommendation Visibility
¦   +-- question-generation.md # 11-category buyer intent taxonomy & prompt pipeline
¦   +-- cost-model.md          # Unit economics & "How much does one scan cost us?"
+-- src/
¦   +-- app/                   # Next.js App Router (Landing page, scan flow, reports)
¦   +-- components/            # UI components (Hero, ScoreCard, CompetitorMatrix)
¦   +-- crawler/               # Safe website extraction & SSRF protection
¦   +-- generator/             # Dynamic buyer question generation
¦   +-- providers/             # AI provider adapters (Gemini Grounding, Perplexity)
¦   +-- analysis/              # Brand posture, competitor & citation detection
¦   +-- recommendations/       # Prescriptive action engine
¦   +-- types/                 # Domain types & interfaces
+-- tests/                     # Unit test suites (SSRF, Brand Detection, Scoring)
+-- public/                    # Static assets & share cards
+-- .env.example               # Environment variable templates
+-- package.json
+-- tsconfig.json
```

---

## 4. Getting Started (Local Development)

### Prerequisites
* Node.js v20+ (tested on v24.x)
* npm or pnpm

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/mukeshfreaky/doesAIrecommendyou.git
   cd doesAIrecommendyou
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Add your server-side API key (Google Gemini recommended for initial implementation):
   ```env
   GEMINI_API_KEY=your_google_gemini_api_key_here
   ```
   *(Note: End users NEVER enter API keys in the browser. All keys remain strictly server-side).*

4. Run unit tests:
   ```bash
   npm test
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Security & Cost Controls

* **SSRF Guard:** Prohibits local, loopback, private RFC 1918, and cloud metadata (`169.254.169.254`) requests.
* **Server-Side Credential Boundary:** Browser clients never receive or transmit provider secrets.
* **Scan Limits & Caching:** 24-hour domain scan caching and IP rate limiting protect against denial-of-wallet attacks.
* **Zero Fabrication Ethic:** If a provider key is absent, the system displays an administrative configuration notice rather than generating simulated responses.

---

## 6. License

MIT License. See LICENSE for details.
