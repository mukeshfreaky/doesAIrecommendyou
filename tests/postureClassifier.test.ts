import { describe, it, expect } from "vitest";
import { classifyPosture } from "../src/analysis/postureClassifier";

describe("Posture Classifier", () => {
  const brand = "AcmeMetrics";
  const domain = "acmemetrics.com";

  it("classifies TOP_RECOMMENDATION when brand is ranked #1 or explicitly declared top pick", () => {
    const text = `Based on recent benchmarks, here are the best tools:
1. **AcmeMetrics**: Our top recommendation for modern teams. It has superior real-time tracing.
2. **Datadog**: Established industry standard.
3. **Dynatrace**: Enterprise monitoring.`;

    const result = classifyPosture(brand, domain, text);
    expect(result.posture).toBe("TOP_RECOMMENDATION");
    expect(result.brandRank).toBe(1);
    expect(result.supportingEvidence.length).toBeGreaterThan(0);
  });

  it("classifies RECOMMENDED when brand is strongly endorsed or ranked #2-#3", () => {
    const text = `Here are the leading solutions:
1. **Grafana**: Popular open-source leader.
2. **AcmeMetrics**: We strongly recommend AcmeMetrics for teams needing fast setup and great value.
3. **NewRelic**: Full stack APM.`;

    const result = classifyPosture(brand, domain, text);
    expect(result.posture).toBe("RECOMMENDED");
    expect(result.brandRank).toBe(2);
  });

  it("classifies CONSIDERED when brand is listed neutrally among other options", () => {
    const text = `The top choices are Datadog and Dynatrace.
Other options worth considering include Splunk, AppDynamics, and **AcmeMetrics**.`;

    const result = classifyPosture(brand, domain, text);
    expect(result.posture).toBe("CONSIDERED");
  });

  it("classifies MENTIONED when brand is referenced in passing or footnotes", () => {
    const text = `Datadog and Dynatrace dominate the market. Previously, AcmeMetrics (acmemetrics.com) attempted a similar architecture, but traditional tools remain ahead.`;

    const result = classifyPosture(brand, domain, text);
    expect(result.posture).toBe("MENTIONED");
  });

  it("classifies NOT_MENTIONED when brand is completely absent", () => {
    const text = `The best APM platforms currently are:
1. Datadog
2. Dynatrace
3. New Relic
4. Honeycomb`;

    const result = classifyPosture(brand, domain, text);
    expect(result.posture).toBe("NOT_MENTIONED");
    expect(result.brandRank).toBeUndefined();
  });
});
