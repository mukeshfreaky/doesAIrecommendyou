# AI Recommendation Visibility Scoring Methodology (Audited)

**Product:** Does AI Recommend You?  
**Document Status:** Audited & Statistically Validated (Phase 0)  
**Date:** September 8, 2026  

---

## 1. Executive Summary & Scoring Philosophy

Most legacy SEO tools assign arbitrary, unexplainable "Authority Scores" (0?100). The **AI Recommendation Visibility Score** in *Does AI Recommend You?* is built on three strict principles:

1. **Transparent & Componentized:** Every point in the score traces directly to observable AI recommendations across evaluated buyer queries.
2. **Postural Nuance:** We strictly distinguish between a mere *mention*, an *active consideration*, a *viable recommendation*, and the *#1 top recommendation*.
3. **Statistical Validity across Single vs. Multi-Provider Scans:** We explicitly reject arbitrary fudge factors (such as awarding free points for unmeasured "consistency" when only a single provider is queried).
4. **Citations as Supporting Evidence, Not Score Drivers:** Citations are analyzed to diagnose *why* a result occurred, not used as an artificial score multiplier.

---

## 2. The 5-Tier Recommendation Posture

For every tested buyer question, the brand's presence in the AI's generated response is classified into one of five mutually exclusive states:

| Posture State | Definition & Semantic Marker | Numerical Weight ($W_q$) |
| :--- | :--- | :--- |
| **`TOP_RECOMMENDATION`** | The AI designates the brand as its #1 choice, primary pick, or top recommendation for the query (e.g. ranked #1 in a structured recommendation list). | **1.00** |
| **`RECOMMENDED`** | The AI actively advises the brand as a strong, viable choice among top candidates (e.g. ranked #2?#3 or explicitly endorsed). | **0.75** |
| **`CONSIDERED`** | The brand is evaluated, listed as an option, or compared, but not directly endorsed over rivals. | **0.40** |
| **`MENTIONED`** | The brand name or domain appears incidentally in passing, as a historical reference, or in a citation, without endorsement. | **0.15** |
| **`NOT_MENTIONED`** | The brand is completely absent from the AI response and sources. | **0.00** |

---

## 3. Mathematical Formulation of the Visibility Score

### A. Fundamental Metrics Across $N$ Buyer Questions
From a set of $N$ tested commercial intent prompts, we compute three observable rates:

1. **Top Recommendation Rate ($R_{	ext{top}}$):**
   $$R_{	ext{top}} = rac{N_{	ext{top}}}{N}$$
2. **Recommendation Rate ($R_{	ext{rec}}$):**
   $$R_{	ext{rec}} = rac{N_{	ext{recommended}} + N_{	ext{top}}}{N}$$
3. **General Consideration Rate ($R_{	ext{cons}}$):**
   $$R_{	ext{cons}} = rac{N_{	ext{considered}} + N_{	ext{recommended}} + N_{	ext{top}}}{N}$$

Notice that by mathematical construction: $0 \le R_{	ext{top}} \le R_{	ext{rec}} \le R_{	ext{cons}} \le 1.0$.

---

### B. Audit Finding & Critique: The "Single-Provider Consistency" Fallacy

> **Audit Correction:** An earlier draft proposed:  
> `S = 100 * (0.40 * R_rec + 0.35 * R_top + 0.15 * R_cons + 0.10 * C_prov)`  
> where `C_prov = 1.0 if R_cons > 0`.  
>
> **Why this was flawed:**  
> In a single-provider scan (such as the initial Gemini MVP), "cross-provider consistency" cannot be measured because only one provider is evaluated ($K=1$). Awarding an arbitrary 10% (10 points) solely because a brand was considered once artificially inflates the score by 10 points and penalizes a brand with 0 points if absent. It conflates consideration with consistency.

---

### C. Corrected Single-Provider Scoring Formula ($K = 1$)

For the MVP and single-provider scans, the weights are normalized strictly over the three observable recommendation dimensions ($\sum w_i = 1.00$):

$$S_{	ext{single}} = 100 	imes \left( 0.50 \cdot R_{	ext{rec}} + 0.35 \cdot R_{	ext{top}} + 0.15 \cdot R_{	ext{cons}} ight)$$

#### Properties:
* **Bounded Range:** $S_{	ext{single}} \in [0, 100]$.
* **Perfect Performance ($R_{	ext{top}} = 1.0 \implies R_{	ext{rec}} = 1.0, R_{	ext{cons}} = 1.0$):**  
  $$S = 100 	imes (0.50 	imes 1.0 + 0.35 	imes 1.0 + 0.15 	imes 1.0) = 100\%$$
* **Zero Visibility ($R_{	ext{cons}} = 0$):**  
  $$S = 100 	imes (0 + 0 + 0) = 0\%$$
* **Mentioned/Considered but Never Recommended ($R_{	ext{top}} = 0, R_{	ext{rec}} = 0, R_{	ext{cons}} = 0.60$):**  
  $$S = 100 	imes (0.15 	imes 0.60) = 9\%$$  
  *(Accurately reflects that while the AI knows the brand exists, it never recommends it to a customer).*

---

### D. Multi-Provider Scoring Formula ($K \ge 2$)

When multiple AI providers are queried (e.g. Gemini, Perplexity, OpenAI):

1. Compute the single-provider score $S_k$ for each provider $k \in \{1, \dots, K\}$:
   $$S_k = 100 	imes \left( 0.50 \cdot R_{	ext{rec}, k} + 0.35 \cdot R_{	ext{top}, k} + 0.15 \cdot R_{	ext{cons}, k} ight)$$

2. Compute the mean score across providers:
   $$ar{S} = rac{1}{K} \sum_{k=1}^K S_k$$

3. Calculate Cross-Provider Consistency ($C_{	ext{prov}} \in [0, 1]$):
   $$C_{	ext{prov}} = 1.0 - rac{	ext{StdDev}(S_1, \dots, S_K)}{50}$$
   *(Clamped between 0.0 and 1.0).*

4. The composite multi-provider score is:
   $$S_{	ext{multi}} = ar{S} 	imes \left( 0.85 + 0.15 \cdot C_{	ext{prov}} ight)$$

This formulation ensures high agreement across models rewards consistency, while severe divergence across models modestly dampens the score, without arbitrarily fabricating data.

---

## 4. Citations: Supporting Evidence vs. Score Proxy

Citations are explicitly separated from the visibility score:
* A brand can be cited in negative or critical articles; treating citation volume as a positive proxy creates false positives.
* Competitors often win the top recommendation with only 1?2 authoritative citations (e.g. high-consensus G2 grids).
* In our platform, citations serve as **Observed Evidence** powering the Prescriptive Action Engine (e.g. *"Competitor X appears in 4 of 5 AI responses because of high citation frequency on G2 and Capterra, where your profile is missing"*).
