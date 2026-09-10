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

  it("gracefully handles malformed or empty AI responses", () => {
    const emptyRes = classifyPosture(brand, domain, "");
    expect(emptyRes.posture).toBe("NOT_MENTIONED");
    expect(emptyRes.supportingEvidence).toHaveLength(0);

    const whitespaceRes = classifyPosture(brand, domain, "   \n\t  ");
    expect(whitespaceRes.posture).toBe("NOT_MENTIONED");

    const garbageRes = classifyPosture(brand, domain, "<xml>{}[]\\///???***</xml>");
    expect(garbageRes.posture).toBe("NOT_MENTIONED");
  });

  describe("ALTERNATIVES Intent & List-Rank Detection", () => {
    it("does not classify target brand as Rank 1 when mentioned inside competitor description", () => {
      const text = `Here are the top alternatives to Resend:
1. **SendGrid** - The most common enterprise alternative to Resend with high-volume deliverability.
2. **Postmark** - Great for transactional emails, often chosen over Resend for latency.
3. **Mailgun** - Another option.`;

      // Non-alternatives intent test for list rank extraction
      const nonAltRes = classifyPosture("Resend", "resend.com", text, "BEST_OF");
      // Resend should NOT be Rank 1 (SendGrid is Rank 1!)
      expect(nonAltRes.brandRank).not.toBe(1);

      // Alternatives intent test
      const altRes = classifyPosture("Resend", "resend.com", text, "ALTERNATIVES");
      expect(altRes.posture).not.toBe("TOP_RECOMMENDATION");
      expect(altRes.posture).not.toBe("RECOMMENDED");
      expect(altRes.alternativeRelationship).toBe("BENCHMARK");
      expect(altRes.brandRank).not.toBe(1);
    });

    it("recognizes target brand as BENCHMARK in alternatives response without purchase recommendation", () => {
      const text = `While Resend is a popular developer-friendly email API, leading alternatives include Postmark, SendGrid, and AWS SES.`;
      const res = classifyPosture("Resend", "resend.com", text, "ALTERNATIVES");
      expect(res.alternativeRelationship).toBe("BENCHMARK");
      expect(res.posture).toBe("CONSIDERED");
      expect(res.recommendationReason).toContain("reference benchmark");
    });

    it("classifies DISPLACED when the AI actively argues against target brand or recommends switching away", () => {
      const text = `Users looking to switch away from Resend often cite high pricing and lack of enterprise support. SendGrid and Postmark are superior choices for large-scale operations.`;
      const res = classifyPosture("Resend", "resend.com", text, "ALTERNATIVES");
      expect(res.alternativeRelationship).toBe("DISPLACED");
      expect(res.posture).toBe("MENTIONED");
      expect(res.recommendationReason).toContain("incumbent, but alternatives are actively recommended");
    });

    it("classifies DEFENDED when the AI advises sticking with or defending target brand", () => {
      const text = `Although there are several alternatives, Resend remains the best option for developers due to its world-class DX. There is no need to switch from Resend.`;
      const res = classifyPosture("Resend", "resend.com", text, "ALTERNATIVES");
      expect(res.alternativeRelationship).toBe("DEFENDED");
      expect(res.posture).toBe("CONSIDERED");
      expect(res.recommendationReason).toContain("defending");
    });
  });
});

