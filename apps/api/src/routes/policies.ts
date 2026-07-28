import { Router } from "express";
import { getAuthContext } from "../lib/auth";
import { normalizePolicyWebsiteUrl } from "../lib/policyWebsite";
import { db, policiesTable, organizationsTable } from "@business-shield/db";
import { eq, and, desc } from "drizzle-orm";
import { GeneratePolicyBody } from "@business-shield/api-zod";

const router = Router();

const POLICY_TEMPLATES: Record<string, (data: { companyName: string; websiteUrl: string; websiteHostname: string; industry?: string; country?: string }) => string> = {
  privacy_policy: ({ companyName, websiteUrl, websiteHostname, industry, country }) => {
    const isEU = country && ["DE", "FR", "NL", "GB", "EU", "BE", "SE", "DK", "FI", "IE", "PL", "AT", "ES", "IT", "PT"].includes(country);
    const isHealthcare = industry === "healthcare";
    const isFintech = industry === "fintech";

    return `# Privacy Policy

**Last Updated:** ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}

## 1. Introduction

${companyName} ("we", "our", "us") operates ${websiteUrl}. This Privacy Policy explains how we collect, use, disclose, and protect your information when you use our services.

## 2. Information We Collect

**Personal Data:** Email address, name, account credentials, and any information you voluntarily provide.

**Usage Data:** IP address, browser type and version, pages visited, time and date of visits, time spent on pages, and diagnostic data.

**Cookies and Tracking:** We use cookies and similar tracking technologies. See our Cookie Policy for details.${isHealthcare ? "\n\n**Protected Health Information (PHI):** If applicable, we handle PHI in accordance with HIPAA requirements. We maintain a signed Business Associate Agreement (BAA) with covered entities." : ""}${isFintech ? "\n\n**Payment Data:** We do not store full payment card numbers. Payment processing complies with PCI-DSS standards." : ""}

## 3. How We Use Your Information

We use your information to: provide and operate our services; process transactions; send service-related communications; improve and personalize your experience; ensure security and prevent fraud; and comply with legal obligations.

## 4. Data Sharing

We do not sell your personal information. We share data only with: service providers acting on our behalf under data processing agreements; legal authorities when required by law; and parties with your explicit consent.
${isEU ? `
## 5. Your Rights Under GDPR

As a data subject under the General Data Protection Regulation (EU) 2016/679, you have the right to: access your personal data (Article 15); rectification of inaccurate data (Article 16); erasure ("right to be forgotten") (Article 17); restriction of processing (Article 18); data portability (Article 20); and object to processing (Article 21).

To exercise these rights, contact us at privacy@${websiteHostname}. We will respond within 30 days as required by GDPR Article 12.

**Legal Basis for Processing:** We process personal data under the following lawful bases: performance of a contract (Article 6(1)(b)); legitimate interests (Article 6(1)(f)); legal obligation (Article 6(1)(c)); and consent (Article 6(1)(a)) where applicable.

**Data Retention:** We retain personal data for no longer than necessary for the stated purposes, subject to legal retention obligations.

**Data Transfers:** Where personal data is transferred outside the EEA, we ensure adequate safeguards under GDPR Chapter V, including Standard Contractual Clauses (SCCs).` : `
## 5. Your Rights

Depending on your location, you may have rights to: access and receive a copy of your data; correct inaccurate data; request deletion of your data; and opt out of certain data uses. Contact us at privacy@${websiteHostname} to exercise these rights.`}

## 6. Security

We implement technical and organizational security measures appropriate to the risk, including encryption in transit (TLS), access controls, and regular security assessments.

## 7. Contact Us

**Data Controller:** ${companyName}
**Privacy inquiries:** privacy@${websiteHostname}
**Website:** ${websiteUrl}`;
  },

  cookie_policy: ({ companyName, websiteUrl, websiteHostname }) => `# Cookie Policy

**Last Updated:** ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}

## What Are Cookies

Cookies are small text files placed on your device when you visit ${websiteUrl}. They enable essential functionality and help us understand how our services are used.

## Cookies We Use

| Category | Purpose | Can be disabled? |
|----------|---------|-----------------|
| **Strictly Necessary** | Authentication, security, session management | No - essential for the site to function |
| **Analytics** | Understand visitor behavior and improve our service | Yes - via cookie preferences |
| **Functional** | Remember your settings and preferences | Yes - via cookie preferences |
| **Marketing** | Targeted advertising (only with consent) | Yes - via cookie preferences |

## Managing Your Cookie Preferences

You can control cookies through: your browser settings; our cookie preference center (accessible via the footer); and opt-out tools provided by analytics vendors (e.g., Google Analytics opt-out).

Note: disabling strictly necessary cookies will impair core functionality.

## Third-Party Cookies

Some cookies are set by third-party services embedded in our pages (e.g., analytics, support chat). These services have their own privacy policies governing cookie use.

## Contact

For questions about our use of cookies: cookies@${websiteHostname}`,

  accessibility_statement: ({ companyName, websiteUrl, websiteHostname }) => `# Accessibility Statement

**Last Updated:** ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}

## Our Commitment

${companyName} is committed to ensuring ${websiteUrl} is accessible to all users, including those with disabilities. We strive to conform to the Web Content Accessibility Guidelines (WCAG) 2.1, Level AA, as specified by the World Wide Web Consortium (W3C).

## Current Conformance Status

**Target standard:** WCAG 2.1 Level AA
**Current status:** Partially conformant - we are actively working to remediate known issues.

## Known Limitations

We are aware of the following areas under active remediation: keyboard navigation improvements; enhanced screen reader compatibility; improved color contrast ratios; and alternative text for all images.

## Assistive Technologies Supported

Our site has been tested with NVDA, VoiceOver (macOS/iOS), TalkBack (Android), and keyboard-only navigation.

## Feedback and Contact

We welcome your feedback on accessibility barriers. Please contact our accessibility team:
- **Email:** accessibility@${websiteHostname}
- **Response time:** We aim to respond within 2 business days.

## Formal Complaints

If you are dissatisfied with our response, you may escalate to your national supervisory authority (e.g., the Equality Advisory and Support Service in the UK, or equivalent body in your jurisdiction).

## Enforcement Procedure

This statement was prepared in accordance with the Web Accessibility Directive (EU Directive 2016/2102) and equivalent national legislation.`,

  terms_of_service: ({ companyName, websiteUrl, websiteHostname }) => `# Terms of Service

**Last Updated:** ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
**Effective Date:** ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}

## 1. Acceptance of Terms

By accessing ${websiteUrl}, you agree to be bound by these Terms of Service and all applicable laws. If you do not agree, do not use the service.

## 2. Description of Service

${companyName} provides the services described on ${websiteUrl}. This draft should be reviewed and adapted to the specific service, customer model, and applicable law before publication.

## 3. User Obligations

You agree to: use the service for lawful purposes only; not infringe on the intellectual property rights of others; not attempt to gain unauthorized access to our systems; and not transmit harmful code or spam.

## 4. Intellectual Property

All content, trademarks, and intellectual property on ${websiteUrl} are owned by ${companyName} or its licensors. You are granted a limited, non-exclusive, non-transferable license to access and use the service for its intended purpose.

## 5. Limitation of Liability

To the fullest extent permitted by law, ${companyName} will not be liable for indirect, incidental, special, consequential, or punitive damages, or any loss of profits or data, arising from your use of the service.

## 6. Disclaimer of Warranties

The service is provided without warranties of any kind, express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement.

## 7. Governing Law

These Terms should identify the governing law selected by ${companyName}. Add the applicable jurisdiction after legal review.

## 8. Changes to Terms

We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the updated terms.

## 9. Contact

Legal inquiries: legal@${websiteHostname}`,
};

router.get("/", async (req, res) => {
  const { userId } = getAuthContext(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const policies = await db
    .select()
    .from(policiesTable)
    .where(eq(policiesTable.userId, userId))
    .orderBy(desc(policiesTable.createdAt));

  return res.json(policies);
});

router.post("/generate", async (req, res) => {
  const { userId } = getAuthContext(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = GeneratePolicyBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  const { type, companyName, websiteUrl, websiteId, additionalContext } = parsed.data;
  const normalizedWebsite = normalizePolicyWebsiteUrl(websiteUrl);
  if (!normalizedWebsite.ok) return res.status(400).json({ error: normalizedWebsite.error });

  const typeLabels: Record<string, string> = {
    privacy_policy: "Privacy Policy",
    cookie_policy: "Cookie Policy",
    accessibility_statement: "Accessibility Statement",
    terms_of_service: "Terms of Service",
  };

  if (!typeLabels[type]) return res.status(400).json({ error: "Unknown policy type" });

  // Load org context for personalization
  const [org] = await db
    .select()
    .from(organizationsTable)
    .where(eq(organizationsTable.userId, userId));

  const template = POLICY_TEMPLATES[type];
  if (!template) return res.status(400).json({ error: "Unknown policy type" });

  let content = template({
    companyName,
    websiteUrl: normalizedWebsite.url,
    websiteHostname: normalizedWebsite.hostname,
    industry: org?.industry ?? undefined,
    country: org?.country ?? undefined,
  });

  if (additionalContext) {
    content += `\n\n## Additional Information\n\n${additionalContext}`;
  }

  const [policy] = await db
    .insert(policiesTable)
    .values({
      userId,
      websiteId: websiteId ?? null,
      type,
      title: `${typeLabels[type]} - ${companyName}`,
      content,
      websiteUrl: normalizedWebsite.url,
      companyName,
    })
    .returning();

  return res.status(201).json(policy);
});

router.get("/:id", async (req, res) => {
  const { userId } = getAuthContext(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const id = parseInt(req.params.id);
  const [policy] = await db
    .select()
    .from(policiesTable)
    .where(and(eq(policiesTable.id, id), eq(policiesTable.userId, userId)));

  if (!policy) return res.status(404).json({ error: "Not found" });
  return res.json(policy);
});

router.delete("/:id", async (req, res) => {
  const { userId } = getAuthContext(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const id = parseInt(req.params.id);
  await db
    .delete(policiesTable)
    .where(and(eq(policiesTable.id, id), eq(policiesTable.userId, userId)));

  return res.status(204).send();
});

export default router;
