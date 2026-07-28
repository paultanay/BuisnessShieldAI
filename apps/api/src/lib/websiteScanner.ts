import { resolveCoverageProfile, type CoverageProfile } from "./complianceCoverage";

export type FindingCategory = "accessibility" | "ssl" | "security" | "privacy" | "seo" | "performance" | "legal";
export type FindingSeverity = "critical" | "high" | "medium" | "low" | "info";

export type ScannerFinding = {
  category: FindingCategory;
  severity: FindingSeverity;
  title: string;
  description: string;
  recommendation: string;
  wcagCriteria?: string | null;
  element?: string | null;
  codeSnippet?: string | null;
};

export type HeaderInput = Headers | Record<string, string | string[] | undefined>;

export type WebsiteDocumentInput = {
  url: string;
  finalUrl?: string;
  status: number;
  headers: HeaderInput;
  html: string;
  industry?: string;
  country?: string | null;
  primaryConcerns?: string[];
};

export type ScanScores = {
  riskScore: number;
  complianceScore: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
};

export type WebsiteScanAnalysis = {
  finalUrl: string;
  coverage: CoverageProfile;
  frameworkLabel: string;
  findings: ScannerFinding[];
  scores: ScanScores;
  summary: string;
};

export type InsertScanFindingRow = ScannerFinding & {
  scanId: number;
  wcagCriteria: string | null;
  element: string | null;
  codeSnippet: string | null;
  isFixed: false;
};

const SEVERITY_WEIGHT: Record<FindingSeverity, number> = {
  critical: 25,
  high: 12,
  medium: 5,
  low: 2,
  info: 0,
};

const INDUSTRY_RISK_MULTIPLIER: Record<string, number> = {
  healthcare: 1.3,
  fintech: 1.25,
  legal: 1.2,
  ecommerce: 1.1,
  saas: 1.05,
  other: 1,
};

export function analyzeWebsiteDocument(input: WebsiteDocumentInput): WebsiteScanAnalysis {
  const finalUrl = input.finalUrl ?? input.url;
  const isHttps = finalUrl.toLowerCase().startsWith("https://");
  const coverage = resolveCoverageProfile({
    country: input.country,
    primaryConcerns: input.primaryConcerns,
  });
  const findings: ScannerFinding[] = [];

  if (!getHeader(input.headers, "content-security-policy")) {
    findings.push({
      category: "security",
      severity: "critical",
      title: "Missing Content Security Policy header",
      description: "No Content-Security-Policy header was detected in the scanned response.",
      recommendation: "Add a restrictive Content-Security-Policy header and prefer nonce-based script execution for dynamic apps.",
      codeSnippet: "Content-Security-Policy: default-src 'self'; frame-ancestors 'none'",
    });
  }

  if (isHttps && !getHeader(input.headers, "strict-transport-security")) {
    findings.push({
      category: "security",
      severity: "high",
      title: "Missing HTTP Strict Transport Security header",
      description: "The site is served over HTTPS but does not send Strict-Transport-Security.",
      recommendation: "Add Strict-Transport-Security with an appropriate max-age after confirming all subdomains support HTTPS.",
      codeSnippet: "Strict-Transport-Security: max-age=31536000; includeSubDomains",
    });
  }

  if (coverage.appliesGdpr && !hasLinkWithAnyTerm(input.html, ["privacy", "data-protection", "data protection"])) {
    findings.push({
      category: "privacy",
      severity: "high",
      title: "Privacy policy link not detected",
      description: "The scan did not detect a privacy policy or data protection link in the page HTML.",
      recommendation: "Publish a discoverable privacy policy link in the footer or primary navigation and keep it reachable from every public page.",
    });
  }

  if (coverage.appliesEprivacy && !hasCookieControls(input.html)) {
    findings.push({
      category: "privacy",
      severity: "high",
      title: "Cookie controls not detected",
      description: "The scan did not detect cookie settings, consent controls, or a cookie policy link.",
      recommendation: "Provide cookie controls before loading non-essential analytics or marketing technologies in regions where consent is required.",
    });
  }

  if (coverage.appliesCcpa && !hasCaliforniaOptOutLink(input.html)) {
    findings.push({
      category: "privacy",
      severity: "high",
      title: "Do Not Sell or Share link not detected",
      description: "The scan did not detect a California privacy opt-out link such as Do Not Sell or Share My Personal Information.",
      recommendation: "If CCPA/CPRA applies, add a clearly labeled opt-out link and support recognized opt-out preference signals.",
    });
  }

  if (!hasMetaDescription(input.html)) {
    findings.push({
      category: "seo",
      severity: "medium",
      title: "Missing meta description",
      description: "The scanned HTML does not include a populated meta description.",
      recommendation: "Add a concise, unique meta description to the page head.",
    });
  }

  const imageWithoutAlt = findFirstImageWithoutAlt(input.html);
  if (imageWithoutAlt) {
    findings.push({
      category: "accessibility",
      severity: "high",
      title: "Images missing alt attributes",
      description: "At least one image is missing an alt attribute, so assistive technologies may not receive equivalent content.",
      recommendation: "Add descriptive alt text to informative images and alt=\"\" for decorative images.",
      wcagCriteria: "WCAG 2.2 - 1.1.1 Non-text Content",
      element: imageWithoutAlt,
    });
  }

  const unlabeledControl = findFirstUnlabeledFormControl(input.html);
  if (unlabeledControl) {
    findings.push({
      category: "accessibility",
      severity: "medium",
      title: "Form controls missing accessible labels",
      description: "At least one form control is missing a visible label or accessible name.",
      recommendation: "Associate controls with visible labels using for/id, wrapping label elements, or an accessible aria-label.",
      wcagCriteria: "WCAG 2.2 - 1.3.1 Info and Relationships",
      element: unlabeledControl,
    });
  }

  const mixedScript = isHttps ? findFirstMixedContentScript(input.html) : null;
  if (mixedScript) {
    findings.push({
      category: "security",
      severity: "high",
      title: "Mixed-content script detected",
      description: "An HTTPS page loads a script over HTTP, which can allow network attackers to modify executable code.",
      recommendation: "Load all scripts over HTTPS and pin trusted third-party scripts where possible.",
      codeSnippet: mixedScript,
    });
  }

  const scores = calculateScanScores(findings, input.industry);
  const frameworkLabel = getFrameworkLabel(coverage, input.industry);

  return {
    finalUrl,
    coverage,
    frameworkLabel,
    findings,
    scores,
    summary: summarizeScan({
      url: finalUrl,
      findings,
      scores,
      frameworkLabel,
    }),
  };
}

export function calculateScanScores(findings: ScannerFinding[], industry = "other"): ScanScores {
  const criticalCount = findings.filter((finding) => finding.severity === "critical").length;
  const highCount = findings.filter((finding) => finding.severity === "high").length;
  const mediumCount = findings.filter((finding) => finding.severity === "medium").length;
  const lowCount = findings.filter((finding) => finding.severity === "low").length;
  const rawRisk = findings.reduce((total, finding) => total + SEVERITY_WEIGHT[finding.severity], 0);
  const multiplier = INDUSTRY_RISK_MULTIPLIER[industry] ?? INDUSTRY_RISK_MULTIPLIER.other;
  const riskScore = Math.min(100, Math.max(0, Math.round(rawRisk * multiplier)));
  const complianceScore = Math.min(100, Math.max(0, 100 - riskScore));

  return {
    riskScore,
    complianceScore,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
  };
}

export function summarizeScan(input: {
  url: string;
  findings: ScannerFinding[];
  scores: ScanScores;
  frameworkLabel: string;
}): string {
  return [
    `Evidence-based ${input.frameworkLabel} scan of ${input.url}.`,
    `Found ${input.findings.length} findings: ${input.scores.criticalCount} critical, ${input.scores.highCount} high, ${input.scores.mediumCount} medium, ${input.scores.lowCount} low.`,
    `Risk score ${input.scores.riskScore}/100 and compliance score ${input.scores.complianceScore}/100.`,
  ].join(" ");
}

export function toInsertScanFindings(scanId: number, findings: ScannerFinding[]): InsertScanFindingRow[] {
  return findings.map((finding) => ({
    scanId,
    category: finding.category,
    severity: finding.severity,
    title: finding.title,
    description: finding.description,
    recommendation: finding.recommendation,
    wcagCriteria: finding.wcagCriteria ?? null,
    element: finding.element ?? null,
    codeSnippet: finding.codeSnippet ?? null,
    isFixed: false,
  }));
}

function getHeader(headers: HeaderInput, name: string): string | undefined {
  if (typeof (headers as Headers).get === "function") {
    return (headers as Headers).get(name) ?? undefined;
  }

  const lowerName = name.toLowerCase();
  const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === lowerName);
  const value = entry?.[1];

  return Array.isArray(value) ? value.join(", ") : value;
}

function hasMetaDescription(html: string): boolean {
  return /<meta\b(?=[^>]*\bname=["']description["'])(?=[^>]*\bcontent=["'][^"']+["'])[^>]*>/i.test(html);
}

function hasLinkWithAnyTerm(html: string, terms: string[]): boolean {
  const normalizedTerms = terms.map((term) => term.toLowerCase());
  const linkRegex = /<a\b[^>]*>[\s\S]*?<\/a>/gi;
  const matches = html.match(linkRegex) ?? [];

  return matches.some((link) => {
    const normalized = link.toLowerCase();
    return normalizedTerms.some((term) => normalized.includes(term));
  });
}

function hasCookieControls(html: string): boolean {
  const normalized = html.toLowerCase();

  return (
    hasLinkWithAnyTerm(html, ["cookie", "consent"]) ||
    normalized.includes("cookie settings") ||
    normalized.includes("cookie preferences") ||
    normalized.includes("manage cookies") ||
    normalized.includes("consent")
  );
}

function hasCaliforniaOptOutLink(html: string): boolean {
  return hasLinkWithAnyTerm(html, [
    "do not sell",
    "do not share",
    "limit use of sensitive",
    "your privacy choices",
    "privacy choices",
  ]);
}

function findFirstImageWithoutAlt(html: string): string | null {
  const imageTags = html.match(/<img\b[^>]*>/gi) ?? [];
  const tag = imageTags.find((candidate) => !/\balt\s*=/i.test(candidate));

  return tag ? normalizeTag(tag) : null;
}

function findFirstUnlabeledFormControl(html: string): string | null {
  const controls = html.match(/<(input|textarea|select)\b[^>]*>/gi) ?? [];
  const unlabeled = controls.find((control) => {
    const type = getAttribute(control, "type")?.toLowerCase();
    if (type && ["hidden", "submit", "button", "reset", "image"].includes(type)) return false;
    if (getAttribute(control, "aria-label") || getAttribute(control, "aria-labelledby")) return false;

    const id = getAttribute(control, "id");
    if (id && new RegExp(`<label\\b[^>]*\\bfor=["']${escapeRegExp(id)}["'][^>]*>`, "i").test(html)) {
      return false;
    }

    return true;
  });

  return unlabeled ? normalizeTag(unlabeled) : null;
}

function findFirstMixedContentScript(html: string): string | null {
  const scripts = html.match(/<script\b[^>]*\bsrc=["']http:\/\/[^"']+["'][^>]*><\/script>/gi) ?? [];
  return scripts[0] ? normalizeTag(scripts[0]) : null;
}

function getAttribute(tag: string, attribute: string): string | null {
  const match = tag.match(new RegExp(`\\b${attribute}\\s*=\\s*["']([^"']+)["']`, "i"));
  return match?.[1] ?? null;
}

function normalizeTag(tag: string): string {
  return tag.replace(/\s+/g, " ").trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getFrameworkLabel(coverage: CoverageProfile, industry = "other"): string {
  if (industry === "healthcare") return coverage.appliesGdpr ? "HIPAA + GDPR readiness" : "HIPAA readiness";
  if (industry === "fintech") return coverage.appliesGdpr ? "PCI DSS + GDPR readiness" : "PCI DSS readiness";
  if (coverage.appliesGdpr) return "GDPR/ePrivacy readiness";
  if (coverage.appliesCcpa) return "CCPA readiness";
  return "security and accessibility readiness";
}
