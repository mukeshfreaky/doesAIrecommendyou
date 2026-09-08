# Buyer-Question Generation Methodology

**Product:** Does AI Recommend You?  
**Document Status:** Complete (Phase 0)  
**Date:** September 2026  

---

## 1. Executive Summary

A critical flaw of first-generation AI monitoring tools is their reliance on either:
1. **Navigational queries** (e.g. *"Tell me about Acme Inc"*), which merely tests LLM memory/training data rather than recommendation preference.
2. **Generic canned prompts** (e.g. *"What is the best software?"*), which fail to reflect real commercial purchase journeys.

In *Does AI Recommend You?*, **buyer-question generation is treated as a first-class engineering system**. The scanner inspects the user's website, extracts its commercial domain, target buyer, and value proposition, and generates 5?10 realistic, high-intent questions that actual buyers ask AI assistants when seeking purchasing recommendations.

---

## 2. The 11-Category Buyer Intent Taxonomy

Real buyers do not ask one single type of question. They progress through specific decision stages:

| # | Intent Category | Buyer Psychology | Example Question Pattern |
| :--- | :--- | :--- | :--- |
| **1** | **Category Discovery** | Exploring solutions in an emerging or established problem space. | *"What are the best [Category] tools currently available?"* |
| **2** | **Best-of Category** | Seeking the consensus market leader for quality. | *"What is the top-rated [Category] for modern teams?"* |
| **3** | **Alternatives to Incumbent** | Dissatisfied with existing dominant software. | *"What are the best alternatives to [Competitor] in 2026?"* |
| **4** | **Direct Head-to-Head** | Deciding between two shortlisted finalists. | *"[Competitor A] vs [Competitor B]: which should I choose for [Use Case]?"* |
| **5** | **Use-Case Specific** | Needs a solution for a precise workflow problem. | *"What [Category] would you recommend for [Specific Workflow]?"* |
| **6** | **Industry / Vertical** | Regulated, niche, or vertical-specific requirements. | *"What is the best [Category] for [Industry, e.g. Healthcare / FinTech]?"* |
| **7** | **Company Size / Stage** | Matching complexity to organizational maturity. | *"Which [Category] is best suited for a 15-person early-stage startup?"* |
| **8** | **Price / Value / Budget** | Cost-conscious or ROI-driven evaluation. | *"What is the most affordable or high-value [Category] for small teams?"* |
| **9** | **Ease of Use / Setup Speed** | Avoiding lengthy enterprise implementations. | *"Which [Category] is easiest to set up without requiring a dedicated developer?"* |
| **10** | **Feature-Specific Intent** | Prioritizing a non-negotiable technical capability. | *"Which [Category] has the best native [Specific Feature] support?"* |
| **11** | **Switching / Migration** | Overcoming high switching friction. | *"What is the easiest [Category] to migrate to from [Legacy Tool]?"* |

---

## 3. Site-to-Prompt Generation Pipeline

```text
[ Target Website URL ]
          |
          v
+-------------------------------------------------------------+
| Step 1: Evidence Collection (src/crawler/)                  |
| - Extract Title, Meta Description, OpenGraph tags           |
| - Extract H1, H2 headings and hero positioning text         |
| - Extract key feature bullet points and target audience     |
+-------------------------------------------------------------+
          |
          v
+-------------------------------------------------------------+
| Step 2: Entity & Semantic Attribute Extraction              |
| - Primary Business Category (e.g. "Customer Support AI")    |
| - Target Audience (e.g. "Shopify merchants", "SaaS SMBs")   |
| - Primary Differentiator (e.g. "Instant setup", "Open source")|
| - Known Competitors / Incumbents referenced in copy         |
+-------------------------------------------------------------+
          |
          v
+-------------------------------------------------------------+
| Step 3: Intent Synthesis Engine                             |
| - Select 5 to 10 balanced intent categories                 |
| - Fill intent templates with extracted domain context       |
| - Ensure prompt neutrality (buyer-perspective)              |
+-------------------------------------------------------------+
          |
          v
[ 5?10 Tailored Buyer Evaluation Questions Ready for Scanning ]
```

---

## 4. Strict Neutrality & Prompt Rules

To preserve complete analytical integrity, prompts sent to AI engines must obey strict prompt construction rules:

1. **Unbiased Buyer Persona:** Prompts must be phrased from the perspective of a genuine, neutral customer asking for advice.
2. **No Leading Prompts:** We never ask: *"Why is Acme the best tool?"* (which forces the AI to flatter the brand).
3. **Natural Phrasing:** Prompts avoid keyword-stuffed SEO syntax (`"crm tools buy best 2026"`) and instead emulate natural conversational queries (`"What CRM would you recommend for an early-stage B2B startup with 10 people?"`).
4. **Competitor Inclusion:** For "Alternatives" queries, the prompt uses the dominant industry incumbent (e.g., if analyzing an issue tracker, query alternatives to Jira or Linear) to see if the user's brand enters the recommendation set.
