# AI Recommendation Visibility Scoring Methodology

**Product:** Does AI Recommend You?  
**Document Status:** Complete (Phase 0)  
**Date:** September 2026  

---

## 1. Executive Summary & Scoring Philosophy

Most legacy SEO tools assign arbitrary "Authority Scores" (0?100) that function as black boxes. In contrast, the **AI Recommendation Visibility Score** in *Does AI Recommend You?* is built on three strict principles:

1. **Transparent & Componentized:** Every point in the score can be directly traced back to observed AI behavior across evaluated buyer questions.
2. **Postural Nuance:** We strictly decouple a mere *mention* from an active *recommendation*, and an active recommendation from a *top pick*.
3. **Citations as Evidence, Not Proxy:** High citation count does not automatically mean a brand is recommended (an AI might cite a site to point out its limitations or cite a comparison where the competitor wins). Citations are analyzed as supporting evidence, not an artificial score multiplier.
4. **No Universal Ranking Claims:** We explicitly disclose to users that this score represents **Recommendation Visibility across tested commercial intent prompts**, not an immutable or universal ranking.

---

## 2. The 5-Tier Recommendation Posture

For every tested buyer question, the brand's presence in the AI's generated response is classified into one of five mutually exclusive states:

| Posture State | Definition & Semantic Marker | Numerical Weight ($W_q$) |
| :--- | :--- | :--- |
| **`TOP_RECOMMENDATION`** | The AI explicitly designates the brand as its #1 overall choice, top pick, or primary recommendation for the question. *(e.g. "For your use case, the best option is Acme...", ranked #1 in numbered list).* | **1.00** |
| **`RECOMMENDED`** | The AI explicitly advises or recommends the brand as a strong, viable choice among top candidates. *(e.g. "We recommend Acme for teams that need...", ranked #2?#3).* | **0.75** |
| **`CONSIDERED`** | The brand is evaluated, compared, or included in an options list, but not directly endorsed over rivals. *(e.g. "Acme is another alternative worth considering, though it lacks...").* | **0.40** |
| **`MENTIONED`** | The brand name or domain appears incidentally in passing, as a historical reference, or in a citation, with no endorsement. *(e.g. "Unlike older legacy tools such as Acme...").* | **0.15** |
| **`NOT_MENTIONED`** | The brand is completely absent from the AI response and its cited sources. | **0.00** |

---

## 3. Mathematical Formulation of the Visibility Score

The aggregate **AI Recommendation Visibility Score ($S$)** is computed on a scale of $0$ to $100$ using four modular, explainable sub-components:

$$S = 100 	imes \left( w_1 \cdot R_{	ext{rec}} + w_2 \cdot R_{	ext{top}} + w_3 \cdot R_{	ext{cons}} + w_4 \cdot C_{	ext{prov}} ight)$$

### Default Component Weights:
* $w_1 = 0.40$ (Recommendation Rate Weight)
* $w_2 = 0.35$ (Top Pick Rate Weight)
* $w_3 = 0.15$ (Consideration / Mention Rate Weight)
* $w_4 = 0.10$ (Cross-Provider Consistency Weight)

*(Note: $\sum w_i = 1.00$. All weights are modular and stored in configuration).*

---

### Component Definitions

#### 1. Recommendation Rate ($R_{	ext{rec}}$)
The proportion of queries where the brand achieved either `RECOMMENDED` or `TOP_RECOMMENDATION` status:
$$R_{	ext{rec}} = rac{N_{	ext{recommended}} + N_{	ext{top}}}{N_{	ext{total}}}$$

#### 2. Top Recommendation Rate ($R_{	ext{top}}$)
The proportion of queries where the brand was crowned the #1 choice:
$$R_{	ext{top}} = rac{N_{	ext{top}}}{N_{	ext{total}}}$$

#### 3. General Consideration Rate ($R_{	ext{cons}}$)
The proportion of queries where the brand entered the AI's consideration set in any form (`CONSIDERED`, `RECOMMENDED`, or `TOP_RECOMMENDATION`):
$$R_{	ext{cons}} = rac{N_{	ext{considered}} + N_{	ext{recommended}} + N_{	ext{top}}}{N_{	ext{total}}}$$

#### 4. Cross-Provider Consistency ($C_{	ext{prov}}$)
When multiple AI systems are queried (e.g. Gemini, Perplexity, ChatGPT), consistency measures whether the brand's visibility is stable or isolated to one engine.
* For single-provider MVP scans: $C_{	ext{prov}}$ defaults to $1.0$ if $R_{	ext{cons}} > 0$, or $0.0$ if absent.
* For multi-provider scans:
$$C_{	ext{prov}} = 1.0 - \sigma_{	ext{normalized}}$$
where $\sigma_{	ext{normalized}}$ is the standard deviation of visibility across providers.

---

## 4. Why Citations Are Supporting Evidence, Not Direct Score Drivers

Traditional SEO tools score heavily based on backlink counts. In AI recommendation engines:
* A brand may have 20 citations on a page because of a negative security incident report.
* A competitor may have only 2 citations from high-consensus comparison roundups (e.g. G2 or Capterra) and win the #1 recommendation spot every time.

Therefore, our system treats Citations as **Observed Supporting Evidence**:
1. We display the cited domains and categorize them (Review Site, Directory, Editorial, Reddit, Documentation).
2. We map which citations supported the user's brand vs. which supported the competitor.
3. We feed citation gaps into the **Prescriptive Action Engine** (e.g. *"Competitor X is recommended because AI frequently cites G2 comparison grids where you are missing"*), rather than artificially inflating the visibility score.

---

## 5. UI Presentation & Transparency Example

In the product UI, the user never sees an unexplained number. They see:

```text
AI RECOMMENDATION VISIBILITY
+-------------------------------------------------------------+
|                            38%                              |
|                                                             |
| Top Recommendation Rate:   10%  (1 of 10 buyer questions)   |
| Recommendation Rate:       40%  (4 of 10 buyer questions)   |
| Consideration Rate:        60%  (6 of 10 buyer questions)   |
| Model Agreement:           85%  (Consistent across runs)    |
+-------------------------------------------------------------+
```

Every metric is clickable, expanding into the exact prompts, generated responses, and competitor rankings that determined the calculation.
