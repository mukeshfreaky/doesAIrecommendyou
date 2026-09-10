import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  TavilyRetriever,
  filterAndNormalizeEvidence,
  normalizeEvidenceUrl,
} from "../src/retrieval/tavily";

describe("Architecture C: Tavily Retriever Unit Tests", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  // Test A: Tavily response normalization
  it("Test A: normalizes raw Tavily search items into valid WebEvidence objects", () => {
    const rawResults = [
      {
        title: "Top Transactional Email APIs 2026",
        url: "https://mailtrap.io/blog/transactional-email-services",
        content: "Detailed benchmarks of Mailtrap, SendGrid, and Resend for developer email deliverability.",
      },
    ];

    const normalized = filterAndNormalizeEvidence(rawResults, 5, "2026-09-10T12:00:00.000Z");
    expect(normalized).toHaveLength(1);
    expect(normalized[0]).toEqual({
      id: "EVIDENCE_1",
      title: "Top Transactional Email APIs 2026",
      url: "https://mailtrap.io/blog/transactional-email-services",
      domain: "mailtrap.io",
      snippet: "Detailed benchmarks of Mailtrap, SendGrid, and Resend for developer email deliverability.",
      retrievedAt: "2026-09-10T12:00:00.000Z",
    });
  });

  // Test B: Duplicate URL removal
  it("Test B: removes duplicate URLs and tracking query parameters", () => {
    const rawResults = [
      {
        title: "Best API Email Platforms",
        url: "https://www.sequenzy.com/blog/best-api-first-email-platforms?utm_source=google&ref=producthunt",
        content: "Postmark and Resend provide top tier deliverability for transactional emails.",
      },
      {
        title: "Best API Email Platforms Duplicate",
        url: "https://sequenzy.com/blog/best-api-first-email-platforms/",
        content: "Duplicate entry with trailing slash and different domain prefix.",
      },
    ];

    const normalized = filterAndNormalizeEvidence(rawResults, 5);
    expect(normalized).toHaveLength(1);
    expect(normalized[0].domain).toBe("sequenzy.com");
  });

  // Test C: Malformed URLs and invalid hostnames rejection
  it("Test C: rejects invalid protocols, malformed URLs, and private network addresses", () => {
    expect(normalizeEvidenceUrl("ftp://files.example.com/file")).toBeNull();
    expect(normalizeEvidenceUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeEvidenceUrl("http://localhost:3000/api")).toBeNull();
    expect(normalizeEvidenceUrl("http://127.0.0.1/admin")).toBeNull();
    expect(normalizeEvidenceUrl("http://192.168.1.1/router")).toBeNull();
    expect(normalizeEvidenceUrl("not-a-valid-url")).toBeNull();

    const rawResults = [
      {
        title: "Bad Protocol",
        url: "ftp://example.com/test",
        content: "Some content here that is long enough.",
      },
      {
        title: "Localhost Source",
        url: "http://localhost:8080/test",
        content: "Localhost data that is long enough.",
      },
      {
        title: "Valid Source",
        url: "https://aurorasendcloud.com/blog/email-delivery",
        content: "Valid third-party comparison of deliverability platforms.",
      },
    ];

    const normalized = filterAndNormalizeEvidence(rawResults, 5);
    expect(normalized).toHaveLength(1);
    expect(normalized[0].domain).toBe("aurorasendcloud.com");
  });

  // Test D: Malformed Tavily response
  it("Test D: returns explicit retrieval error when Tavily returns malformed or non-array payload", async () => {
    process.env.TAVILY_API_KEY = "tvly-test-key-12345";
    const retriever = new TavilyRetriever();

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: "not-an-array" }),
    } as any);

    const result = await retriever.retrieve("Email API deliverability");
    expect(result.success).toBe(false);
    expect(result.evidence).toEqual([]);
    expect(result.error).toContain("malformed");
  });

  // Test E: Tavily timeout handling
  it("Test E: returns explicit retrieval error when request times out", async () => {
    process.env.TAVILY_API_KEY = "tvly-test-key-12345";
    const retriever = new TavilyRetriever();

    vi.spyOn(global, "fetch").mockImplementationOnce(() => {
      const abortError = new Error("The operation was aborted");
      abortError.name = "AbortError";
      return Promise.reject(abortError);
    });

    const result = await retriever.retrieve("Email API deliverability", { timeoutMs: 100 });
    expect(result.success).toBe(false);
    expect(result.evidence).toEqual([]);
    expect(result.error).toContain("timed out");
  });

  // Test F: Deterministic sequential EVIDENCE_1...EVIDENCE_5 assignment
  it("Test F: assigns deterministic sequential IDs (EVIDENCE_1...EVIDENCE_5) up to max cap", () => {
    const rawResults = Array.from({ length: 8 }, (_, i) => ({
      title: "Platform Review " + (i + 1),
      url: "https://source" + (i + 1) + ".com/article",
      content: "Substantive deliverability comparison data for platform " + (i + 1) + " with enough length.",
    }));

    const normalized = filterAndNormalizeEvidence(rawResults, 5);
    expect(normalized).toHaveLength(5);
    expect(normalized.map((e) => e.id)).toEqual([
      "EVIDENCE_1",
      "EVIDENCE_2",
      "EVIDENCE_3",
      "EVIDENCE_4",
      "EVIDENCE_5",
    ]);
  });
});