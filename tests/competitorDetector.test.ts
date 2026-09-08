import { describe, it, expect } from "vitest";
import { detectCompetitors } from "../src/analysis/competitorDetector";

describe("Competitor Detector", () => {
  const targetBrand = "Loom";
  const targetDomain = "loom.com";

  it("extracts competitor entities and ranks from multiple AI responses", () => {
    const responses = [
      {
        text: `The top screen recorders are:
1. **Vidyard**: Great for enterprise sales teams.
2. **Loom**: Easy to share quick videos.
3. **Descript**: Best for podcast and video editing.`,
      },
      {
        text: `When comparing alternatives:
1. **Vidyard** offers advanced analytics.
2. **CloudApp** (Zight) is simple and fast.`,
      },
    ];

    const competitors = detectCompetitors(responses, targetBrand, targetDomain);

    // Vidyard appeared in 2 responses, Descript in 1, CloudApp in 1
    const vidyard = competitors.find((c) => c.name === "Vidyard");
    expect(vidyard).toBeDefined();
    expect(vidyard?.frequency).toBe(2);
    expect(vidyard?.posture).toBe("TOP_RECOMMENDATION");

    // Target brand (Loom) must NOT appear in competitor list
    const loom = competitors.find((c) => c.name.toLowerCase() === "loom");
    expect(loom).toBeUndefined();
  });

  it("filters out generic markdown labels like Pricing or Summary", () => {
    const responses = [
      {
        text: `**Summary**:
1. **Wistia** is ideal for marketing.
**Pricing**: Starts at $24/mo.`,
      },
    ];

    const competitors = detectCompetitors(responses, targetBrand, targetDomain);
    expect(competitors.find((c) => c.name === "Wistia")).toBeDefined();
    expect(competitors.find((c) => c.name === "Summary")).toBeUndefined();
    expect(competitors.find((c) => c.name === "Pricing")).toBeUndefined();
  });
});
