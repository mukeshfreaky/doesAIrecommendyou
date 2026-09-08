import { describe, it, expect } from "vitest";
import { extractBusinessProfile } from "../src/crawler/extractor";
import { generateBuyerQuestions, validateQuestionQuality } from "../src/generator/questionGenerator";
import { CrawledPage } from "../src/types";

describe("Adversarial Fixture & Evidence-Bound Question Generation Tests", () => {
  describe("Fixture 1: Resend (Email for Developers)", () => {
    // Simulating crawled HTML pages from resend.com
    const resendPages: CrawledPage[] = [
      {
        url: "https://resend.com",
        title: "Resend · Email for developers",
        description: "The best email API to reach humans instead of spam folders. Build, test, and deliver transactional and marketing emails at scale.",
        headings: [
          "Email for developers",
          "Send transactional and marketing emails",
          "Built for your favorite programming languages",
          "First-class React email templates",
          "First-class deliverability",
        ],
        text: "Resend is the modern email platform designed for developers and software engineering teams. HIPAA compliant. We work with medical and fintech customers to ensure high deliverability.",
        links: ["https://resend.com/pricing", "https://resend.com/features/broadcasts"],
        fetchedAt: new Date().toISOString(),
      },
      {
        url: "https://resend.com/features/broadcasts",
        title: "Broadcasts · Resend",
        description: "Send broadcast emails to your audience.",
        headings: ["Broadcasts for modern teams", "Broadcast analytics and click tracking"],
        text: "Send marketing campaigns and newsletters to your subscribers.",
        links: [],
        fetchedAt: new Date().toISOString(),
      },
      {
        url: "https://resend.com/pricing",
        title: "Pricing · Resend",
        description: "Start sending emails for free, upgrade as you grow.",
        headings: ["Pricing plans", "Free tier", "Pro plan at $20/month"],
        text: "Free tier includes 3,000 emails/month. Pro plan is $20/month for 50,000 emails.",
        links: [],
        fetchedAt: new Date().toISOString(),
      },
    ];

    it("extracts clean brand name without trailing tagline or middle dot", () => {
      const profile = extractBusinessProfile(resendPages, "https://resend.com");
      expect(profile.name).toBe("Resend");
      expect(profile.domain).toBe("resend.com");
    });

    it("identifies high-confidence canonical category as Email Delivery API", () => {
      const profile = extractBusinessProfile(resendPages, "https://resend.com");
      expect(profile.canonicalCategory).toBe("Email Delivery & Transactional Email API");
      expect(profile.canonicalCategoryConfidence).toBe("HIGH");
    });

    it("does NOT hallucinate 'medical' industry despite HIPAA/medical mention in body text", () => {
      const profile = extractBusinessProfile(resendPages, "https://resend.com");
      expect(profile.industries).not.toContain("medical");
      expect(profile.industries).not.toContain("healthcare");
    });

    it("does NOT extract 'your favorite programming languages' as a target customer", () => {
      const profile = extractBusinessProfile(resendPages, "https://resend.com");
      for (const target of profile.targetCustomers) {
        expect(target.toLowerCase()).not.toContain("programming lang");
        expect(target.toLowerCase()).not.toContain("favorite");
      }
      expect(profile.targetCustomers.some((t) => t.includes("developer") || t.includes("engineer"))).toBe(true);
    });

    it("generates 5 valid questions without contaminated phrases or hallucinated industries", () => {
      const profile = extractBusinessProfile(resendPages, "https://resend.com");
      const questions = generateBuyerQuestions(profile);

      expect(questions).toHaveLength(5);

      for (const q of questions) {
        const validation = validateQuestionQuality(q.question, profile);
        expect(validation.valid).toBe(true);

        const lower = q.question.toLowerCase();
        expect(lower).not.toContain("broadcast analytics");
        expect(lower).not.toContain("medical");
        expect(lower).not.toContain("favorite programming");
        expect(lower).not.toContain("programming lang");
      }
    });
  });

  describe("Fixture 2: Stripe (Financial Infrastructure & Payments)", () => {
    const stripePages: CrawledPage[] = [
      {
        url: "https://stripe.com",
        title: "Stripe | Financial Infrastructure for the Internet",
        description: "Millions of companies of all sizes—from startups to Fortune 500s—use Stripe’s software and APIs to accept payments, send payouts, and manage their businesses online.",
        headings: [
          "Financial infrastructure for the internet",
          "A complete payments platform engineered for growth",
          "Designed for developers and enterprise scale",
        ],
        text: "Accept payments and scale globally with Stripe's unified payment APIs.",
        links: ["https://stripe.com/pricing"],
        fetchedAt: new Date().toISOString(),
      },
    ];

    it("derives canonical category for Stripe as Payment Processing & Financial Infrastructure", () => {
      const profile = extractBusinessProfile(stripePages, "https://stripe.com");
      expect(profile.name).toBe("Stripe");
      expect(profile.canonicalCategory).toBe("Payment Processing & Financial Infrastructure");
      expect(profile.canonicalCategoryConfidence).toBe("HIGH");
      expect(profile.industries).not.toContain("medical");
    });

    it("generates 5 valid questions for Stripe without industry hallucination", () => {
      const profile = extractBusinessProfile(stripePages, "https://stripe.com");
      const questions = generateBuyerQuestions(profile);

      expect(questions).toHaveLength(5);
      for (const q of questions) {
        const validation = validateQuestionQuality(q.question, profile);
        expect(validation.valid).toBe(true);
        expect(q.question.toLowerCase()).not.toContain("medical");
        expect(q.question.toLowerCase()).not.toContain("healthcare");
      }
    });
  });

  describe("Fixture 3: Shopify (E-commerce Platform)", () => {
    const shopifyPages: CrawledPage[] = [
      {
        url: "https://shopify.com",
        title: "Shopify: Start a business, sell products online",
        description: "The global commerce platform built for merchants, retailers, and online stores.",
        headings: [
          "The one platform behind 1M+ businesses",
          "Everything you need to sell online",
        ],
        text: "Create an ecommerce store and start selling products worldwide with Shopify.",
        links: [],
        fetchedAt: new Date().toISOString(),
      },
    ];

    it("derives canonical category for Shopify as E-commerce Platform", () => {
      const profile = extractBusinessProfile(shopifyPages, "https://shopify.com");
      expect(profile.name).toBe("Shopify");
      expect(profile.canonicalCategory).toBe("E-commerce Platform & Online Storefronts");
      expect(profile.canonicalCategoryConfidence).toBe("HIGH");
    });

    it("generates 5 valid questions for Shopify without developer infra contamination", () => {
      const profile = extractBusinessProfile(shopifyPages, "https://shopify.com");
      const questions = generateBuyerQuestions(profile);

      expect(questions).toHaveLength(5);
      for (const q of questions) {
        const validation = validateQuestionQuality(q.question, profile);
        expect(validation.valid).toBe(true);
      }
    });
  });

  describe("Fixture 4: Weak / Minimalist Website (Low Information)", () => {
    const weakPages: CrawledPage[] = [
      {
        url: "https://acmeglobal.xyz",
        title: "Acme Global - Welcome",
        description: "We provide bespoke business consulting and custom digital solutions.",
        headings: ["Welcome to Acme Global", "About Us"],
        text: "Welcome to Acme Global. We offer quality services for our partners.",
        links: [],
        fetchedAt: new Date().toISOString(),
      },
    ];

    it("handles minimal site gracefully with low confidence and no crashes", () => {
      const profile = extractBusinessProfile(weakPages, "https://acmeglobal.xyz");
      expect(profile.name).toBe("Acme Global");
      expect(profile.domain).toBe("acmeglobal.xyz");
      expect(profile.canonicalCategoryConfidence).toBe("LOW");
      expect(profile.industries).toEqual([]);
    });

    it("generates 5 valid, non-corrupted buyer questions for weak sites", () => {
      const profile = extractBusinessProfile(weakPages, "https://acmeglobal.xyz");
      const questions = generateBuyerQuestions(profile);

      expect(questions).toHaveLength(5);
      for (const q of questions) {
        const validation = validateQuestionQuality(q.question, profile);
        expect(validation.valid).toBe(true);
        expect(q.question.endsWith("?")).toBe(true);
      }
    });
  });
});
