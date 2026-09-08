# Technical Architecture Specification

**Product:** Does AI Recommend You?  
**Document Status:** Complete (Phase 0)  
**Date:** September 2026  

---

## 1. Architectural Philosophy: Clean Modular Monolith

To maximize development velocity, maintain strict type safety, minimize hosting costs, and ensure zero operational friction, the product is built as a **TypeScript Modular Monolith** using **Next.js (App Router)**.

### Architectural Rules:
1. **No Microservices / No Kubernetes:** All scanning, parsing, provider querying, analysis, and rendering occur within a unified, well-structured codebase.
2. **Server-Side Credential Boundary:** Browser clients NEVER touch AI provider credentials. All API communication occurs server-side via Next.js Route Handlers.
3. **Evidence-Driven Decoupling:** The crawling, prompt generation, AI query, brand detection, and recommendation layers are strictly decoupled and covered by isolated unit tests.
4. **Resilience & Graceful Degradation:** A failure in an external search or single question analysis will never crash the overall report.

---

## 2. System Overview & Data Flow Pipeline

```text
[ User enters URL / Brand ]
           |
           v
+--------------------------------------------------------------+
| 1. Evidence Crawler & Site Analyzer (src/crawler/)          |
|    - SSRF & IP validation filter                            |
|    - HTML extraction (meta, titles, headers, product text)  |
|    - Brand alias & category deduction                        |
+--------------------------------------------------------------+
           |
           v
+--------------------------------------------------------------+
| 2. Buyer Intent Question Generator (src/generator/)         |
|    - Evaluates business domain & service offering           |
|    - Synthesizes 5-10 realistic commercial buyer prompts     |
|    - (Best-of, Alternatives, Use-case, SMB vs Enterprise)   |
+--------------------------------------------------------------+
           |
           v
+--------------------------------------------------------------+
| 3. Provider Abstraction Layer (src/providers/)              |
|    - AIProvider Interface (Gemini, Perplexity, OpenAI)       |
|    - Server-side execution with web search grounding        |
|    - Raw response, citations, & token cost logging          |
+--------------------------------------------------------------+
           |
           v
+--------------------------------------------------------------+
| 4. Analysis & Extraction Engine (src/analysis/)              |
|    - Brand Detection (5-Tier Recommendation Posture)        |
|    - Competitor Extraction & Position Mapping               |
|    - Citation Authority & Category Classification           |
|    - AI Claim vs. Website Evidence Verification             |
|    - Transparent Visibility Score Calculation (0-100%)       |
+--------------------------------------------------------------+
           |
           v
+--------------------------------------------------------------+
| 5. Prescriptive Action Engine (src/recommendations/)         |
|    - Observed Evidence -> Inference -> Action Plan          |
|    - Prioritized tactical playbooks                         |
+--------------------------------------------------------------+
           |
           v
[ Interactive Report Dashboard & Social Share Card ]
```

---

## 3. Directory Layout & Module Responsibilities

```text
does-ai-recommend-you/
??? docs/                      # Strategic, research, and technical specifications
?   ??? competitive-analysis.md
?   ??? research.md
?   ??? business-validation.md
?   ??? architecture.md
?   ??? scoring-methodology.md
?   ??? question-generation.md
?   ??? cost-model.md
??? src/
?   ??? app/                   # Next.js App Router (pages & API routes)
?   ?   ??? layout.tsx         # Global shell, typography, analytics
?   ?   ??? page.tsx           # High-converting landing page
?   ?   ??? scan/              # Live scan execution & progress view
?   ?   ??? report/[id]/       # Interactive report & shareable view
?   ?   ??? api/
?   ?       ??? scan/route.ts  # End-to-end scan pipeline handler
?   ?       ??? health/        # System health check & config status
?   ??? components/            # Reusable UI components (Tailwind CSS)
?   ??? crawler/               # Safe website extraction & evidence gathering
?   ?   ??? ssrfValidator.ts   # Private/local IP blocker
?   ?   ??? fetcher.ts         # Resilient HTTP fetcher (timeout, size limits)
?   ?   ??? parser.ts          # Content & business identity extractor
?   ??? generator/             # High-intent customer question generation
?   ??? providers/             # Modular AI provider adapters
?   ?   ??? types.ts           # AIProvider, AIResponse, Citation, TokenUsage
?   ?   ??? registry.ts        # Provider manager & server-key validator
?   ?   ??? gemini.ts          # Google Gemini 2.0 Flash + Search Grounding
?   ?   ??? perplexity.ts      # Perplexity Sonar adapter
?   ?   ??? openai.ts          # OpenAI web_search adapter
?   ??? analysis/              # Response understanding & classification
?   ?   ??? brandDetection.ts  # 5-tier recommendation posture classifier
?   ?   ??? competitorDetection.ts # Competitor entity & rank extractor
?   ?   ??? citationAnalysis.ts    # Citation categorization & domain parser
?   ?   ??? claimVerification.ts   # AI Claim vs Website Evidence engine
?   ?   ??? scoring.ts         # Transparent 0-100% visibility score
?   ??? recommendations/       # Prescriptive action engine
?   ?   ??? types.ts           # Evidence, Inference, Action definitions
?   ?   ??? actionEngine.ts    # Prioritized tactical rule engine
?   ??? types/                 # Shared domain data models
??? tests/                     # Unit and integration test suites (Vitest)
??? public/                    # Static assets, logos, favicon
??? .env.example               # Template for environment configuration
??? package.json
??? tsconfig.json
??? tailwind.config.ts
```

---

## 4. Key Security & Safety Architectural Decisions

### A. SSRF Protection & Safe Crawling
* Every incoming domain is resolved to an IP address before HTTP requests are issued.
* Strict blacklist enforced: `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`, IPv6 loopbacks (`::1`).
* All redirects are re-resolved and re-validated.
* Request body hard limit: 1.5MB; timeout: 5,000ms.

### B. Strict Server-Side Key Management
* Never pass provider keys to the browser.
* Next.js server runtime isolates `process.env.GEMINI_API_KEY`, etc.
* Missing server keys trigger administrative notices in development, not client inputs.

### C. Input Sanitization & Anti-Abuse
* Input URLs are parsed and normalized (protocol, lowercase hostname, strip query parameters and hash fragments).
* Rate limiting per IP on the `/api/scan` endpoint to prevent bot denial-of-wallet.
* Query text sent to AI providers is strictly structured to avoid prompt injection from untrusted page contents.
