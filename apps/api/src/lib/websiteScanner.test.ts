import { describe, expect, it } from "vitest";
import { analyzeWebsiteDocument, calculateScanScores, toInsertScanFindings } from "./websiteScanner";

const BASE_HTML = `
<!doctype html>
<html lang="en">
  <head><title>Acme</title></head>
  <body>
    <main>
      <img src="/hero.png">
      <form><input name="email" type="email"></form>
      <script src="http://cdn.example.com/checkout.js"></script>
    </main>
  </body>
</html>
`;

describe("analyzeWebsiteDocument", () => {
  it("emits deterministic evidence-backed findings from missing headers and HTML gaps", () => {
    const analysis = analyzeWebsiteDocument({
      url: "https://example.com",
      status: 200,
      headers: {},
      html: BASE_HTML,
      country: "DE",
      primaryConcerns: [],
    });

    expect(analysis.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: "security",
          severity: "critical",
          title: "Missing Content Security Policy header",
        }),
        expect.objectContaining({
          category: "security",
          severity: "high",
          title: "Missing HTTP Strict Transport Security header",
        }),
        expect.objectContaining({
          category: "privacy",
          severity: "high",
          title: "Privacy policy link not detected",
        }),
        expect.objectContaining({
          category: "privacy",
          severity: "high",
          title: "Cookie controls not detected",
        }),
        expect.objectContaining({
          category: "seo",
          severity: "medium",
          title: "Missing meta description",
        }),
        expect.objectContaining({
          category: "accessibility",
          severity: "high",
          title: "Images missing alt attributes",
          element: '<img src="/hero.png">',
        }),
        expect.objectContaining({
          category: "accessibility",
          severity: "medium",
          title: "Form controls missing accessible labels",
          element: '<input name="email" type="email">',
        }),
        expect.objectContaining({
          category: "security",
          severity: "high",
          title: "Mixed-content script detected",
          codeSnippet: '<script src="http://cdn.example.com/checkout.js"></script>',
        }),
      ]),
    );
  });

  it("does not emit CSP or HSTS findings when headers are present", () => {
    const analysis = analyzeWebsiteDocument({
      url: "https://example.com",
      status: 200,
      headers: {
        "content-security-policy": "default-src 'self'",
        "strict-transport-security": "max-age=31536000; includeSubDomains",
      },
      html: `
        <html>
          <head><title>Acme</title><meta name="description" content="A useful product"></head>
          <body>
            <a href="/privacy">Privacy Policy</a>
            <button id="cookie-settings">Cookie settings</button>
            <img src="/hero.png" alt="Acme dashboard">
            <label for="email">Email</label><input id="email" name="email" type="email">
          </body>
        </html>
      `,
      country: "DE",
      primaryConcerns: [],
    });

    expect(analysis.findings.some((finding) => finding.title.includes("Content Security Policy"))).toBe(false);
    expect(analysis.findings.some((finding) => finding.title.includes("Strict Transport Security"))).toBe(false);
  });

  it("does not apply GDPR privacy-link checks to India unless GDPR is explicit", () => {
    const india = analyzeWebsiteDocument({
      url: "https://example.in",
      status: 200,
      headers: {},
      html: BASE_HTML,
      country: "IN",
      primaryConcerns: [],
    });

    const indiaWithGdpr = analyzeWebsiteDocument({
      url: "https://example.in",
      status: 200,
      headers: {},
      html: BASE_HTML,
      country: "IN",
      primaryConcerns: ["gdpr"],
    });

    expect(india.findings.some((finding) => finding.title === "Privacy policy link not detected")).toBe(false);
    expect(indiaWithGdpr.findings.some((finding) => finding.title === "Privacy policy link not detected")).toBe(true);
  });

  it("emits CCPA opt-out finding only when CCPA applies", () => {
    const us = analyzeWebsiteDocument({
      url: "https://example.com",
      status: 200,
      headers: {},
      html: BASE_HTML,
      country: "US",
      primaryConcerns: [],
    });
    const india = analyzeWebsiteDocument({
      url: "https://example.in",
      status: 200,
      headers: {},
      html: BASE_HTML,
      country: "IN",
      primaryConcerns: [],
    });

    expect(us.findings.some((finding) => finding.title === "Do Not Sell or Share link not detected")).toBe(true);
    expect(india.findings.some((finding) => finding.title === "Do Not Sell or Share link not detected")).toBe(false);
  });

  it("calculates deterministic scores for the same findings", () => {
    const analysis = analyzeWebsiteDocument({
      url: "https://example.com",
      status: 200,
      headers: {},
      html: BASE_HTML,
      country: "DE",
      primaryConcerns: [],
    });

    expect(calculateScanScores(analysis.findings, "saas")).toEqual(calculateScanScores(analysis.findings, "saas"));
  });

  it("maps scanner findings to database insert rows", () => {
    const analysis = analyzeWebsiteDocument({
      url: "https://example.com",
      status: 200,
      headers: {},
      html: BASE_HTML,
      country: "DE",
      primaryConcerns: [],
    });

    const rows = toInsertScanFindings(42, analysis.findings);

    expect(rows[0]).toEqual({
      scanId: 42,
      category: analysis.findings[0].category,
      severity: analysis.findings[0].severity,
      title: analysis.findings[0].title,
      description: analysis.findings[0].description,
      recommendation: analysis.findings[0].recommendation,
      wcagCriteria: analysis.findings[0].wcagCriteria ?? null,
      element: analysis.findings[0].element ?? null,
      codeSnippet: analysis.findings[0].codeSnippet ?? null,
      isFixed: false,
    });
  });
});
