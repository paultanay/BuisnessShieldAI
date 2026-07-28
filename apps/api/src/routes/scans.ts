import { Router } from "express";
import { getAuthContext } from "../lib/auth";
import { validateScanTargetUrl } from "../lib/scanTarget";
import { analyzeWebsiteDocument, toInsertScanFindings } from "../lib/websiteScanner";
import { db, websitesTable, scansTable, scanFindingsTable, alertsTable, organizationsTable } from "@business-shield/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { TriggerScanBody } from "@business-shield/api-zod";

const router = Router({ mergeParams: true });

router.get("/websites/:websiteId/scans", async (req, res) => {
  const { userId } = getAuthContext(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const websiteId = parseInt(req.params.websiteId, 10);
  const [website] = await db
    .select()
    .from(websitesTable)
    .where(and(eq(websitesTable.id, websiteId), eq(websitesTable.userId, userId)));

  if (!website) return res.status(404).json({ error: "Website not found" });

  const scans = await db
    .select()
    .from(scansTable)
    .where(eq(scansTable.websiteId, websiteId))
    .orderBy(desc(scansTable.createdAt));

  return res.json(scans);
});

router.post("/websites/:websiteId/scans", async (req, res) => {
  const { userId } = getAuthContext(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const websiteId = parseInt(req.params.websiteId, 10);
  const [website] = await db
    .select()
    .from(websitesTable)
    .where(and(eq(websitesTable.id, websiteId), eq(websitesTable.userId, userId)));

  if (!website) return res.status(404).json({ error: "Website not found" });

  const parsed = TriggerScanBody.safeParse(req.body);
  const scanTypes =
    parsed.success && parsed.data.scanTypes
      ? parsed.data.scanTypes
      : ["accessibility", "ssl", "security", "privacy", "seo", "performance"];

  const [scan] = await db
    .insert(scansTable)
    .values({ websiteId, status: "running", scanTypes })
    .returning();

  const [org] = await db
    .select()
    .from(organizationsTable)
    .where(eq(organizationsTable.userId, userId));

  runWebsiteScan({
    scanId: scan.id,
    websiteId,
    url: website.url,
    userId,
    industry: org?.industry ?? "other",
    country: org?.country ?? "US",
    primaryConcerns: org?.primaryConcerns ?? [],
  }).catch(() => {});

  return res.status(201).json(scan);
});

router.get("/scans/:id", async (req, res) => {
  const { userId } = getAuthContext(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const id = parseInt(req.params.id, 10);
  const [scan] = await db.select().from(scansTable).where(eq(scansTable.id, id));
  if (!scan) return res.status(404).json({ error: "Not found" });

  const [website] = await db
    .select()
    .from(websitesTable)
    .where(and(eq(websitesTable.id, scan.websiteId), eq(websitesTable.userId, userId)));

  if (!website) return res.status(403).json({ error: "Forbidden" });
  return res.json(scan);
});

router.get("/scans/:id/findings", async (req, res) => {
  const { userId } = getAuthContext(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const id = parseInt(req.params.id, 10);
  const [scan] = await db.select().from(scansTable).where(eq(scansTable.id, id));
  if (!scan) return res.status(404).json({ error: "Not found" });

  const [website] = await db
    .select()
    .from(websitesTable)
    .where(and(eq(websitesTable.id, scan.websiteId), eq(websitesTable.userId, userId)));

  if (!website) return res.status(403).json({ error: "Forbidden" });

  const findings = await db
    .select()
    .from(scanFindingsTable)
    .where(eq(scanFindingsTable.scanId, id))
    .orderBy(
      sql`CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END`,
    );

  return res.json(findings);
});

router.patch("/findings/:findingId/fix", async (req, res) => {
  const { userId } = getAuthContext(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const findingId = parseInt(req.params.findingId, 10);
  const [finding] = await db
    .select()
    .from(scanFindingsTable)
    .where(eq(scanFindingsTable.id, findingId));

  if (!finding) return res.status(404).json({ error: "Finding not found" });

  const [scan] = await db.select().from(scansTable).where(eq(scansTable.id, finding.scanId));
  if (!scan) return res.status(404).json({ error: "Scan not found" });

  const [website] = await db
    .select()
    .from(websitesTable)
    .where(and(eq(websitesTable.id, scan.websiteId), eq(websitesTable.userId, userId)));

  if (!website) return res.status(403).json({ error: "Forbidden" });

  const [updated] = await db
    .update(scanFindingsTable)
    .set({ isFixed: true })
    .where(eq(scanFindingsTable.id, findingId))
    .returning();

  return res.json(updated);
});

type WebsiteScanJob = {
  scanId: number;
  websiteId: number;
  url: string;
  userId: string;
  industry: string;
  country: string;
  primaryConcerns: string[];
};

async function runWebsiteScan(job: WebsiteScanJob) {
  try {
    const target = await validateScanTargetUrl(job.url);
    if (!target.ok) throw new Error(target.error);

    const document = await fetchWebsiteDocument(target.url);
    const analysis = analyzeWebsiteDocument({
      url: target.url,
      finalUrl: document.finalUrl,
      status: document.status,
      headers: document.headers,
      html: document.html,
      industry: job.industry,
      country: job.country,
      primaryConcerns: job.primaryConcerns,
    });
    const findingRows = toInsertScanFindings(job.scanId, analysis.findings);
    const insertedFindings =
      findingRows.length > 0 ? await db.insert(scanFindingsTable).values(findingRows).returning() : [];

    await db
      .update(scansTable)
      .set({
        status: "completed",
        riskScore: analysis.scores.riskScore,
        complianceScore: analysis.scores.complianceScore,
        summary: analysis.summary,
        findingsCount: insertedFindings.length,
        criticalCount: analysis.scores.criticalCount,
        highCount: analysis.scores.highCount,
        mediumCount: analysis.scores.mediumCount,
        lowCount: analysis.scores.lowCount,
        completedAt: new Date(),
      })
      .where(eq(scansTable.id, job.scanId));

    await db
      .update(websitesTable)
      .set({
        riskScore: analysis.scores.riskScore,
        complianceScore: analysis.scores.complianceScore,
        lastScannedAt: new Date(),
      })
      .where(eq(websitesTable.id, job.websiteId));

    if (analysis.scores.criticalCount > 0) {
      await db.insert(alertsTable).values({
        userId: job.userId,
        websiteId: job.websiteId,
        type: "security_issue",
        severity: "critical",
        title: `${analysis.scores.criticalCount} Critical Issue${analysis.scores.criticalCount > 1 ? "s" : ""} Found`,
        message: `Evidence-based scan found ${analysis.scores.criticalCount} critical issue${analysis.scores.criticalCount > 1 ? "s" : ""} on ${analysis.finalUrl}. Review findings and remediation steps.`,
      });
    }

    await db.insert(alertsTable).values({
      userId: job.userId,
      websiteId: job.websiteId,
      type: "scan_complete",
      severity: analysis.scores.riskScore > 70 ? "high" : analysis.scores.riskScore > 40 ? "medium" : "info",
      title: "Scan Complete",
      message: `Risk score: ${analysis.scores.riskScore}/100 | Compliance: ${analysis.scores.complianceScore}/100 | ${insertedFindings.length} findings across ${new Set(insertedFindings.map((finding) => finding.category)).size} categories.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown scanner failure";

    await db
      .update(scansTable)
      .set({
        status: "failed",
        summary: `Scan failed for ${job.url}: ${message}`,
        completedAt: new Date(),
      })
      .where(eq(scansTable.id, job.scanId));

    await db.insert(alertsTable).values({
      userId: job.userId,
      websiteId: job.websiteId,
      type: "info",
      severity: "high",
      title: "Scan Failed",
      message: `BusinessShield could not scan ${job.url}. ${message}`,
    });
  }
}

async function fetchWebsiteDocument(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "BusinessShieldScanner/0.1 (+https://businessshield.local)",
      },
    });
    const contentType = response.headers.get("content-type") ?? "";
    const isHtml = contentType.includes("text/html") || contentType.includes("application/xhtml+xml");

    return {
      finalUrl: response.url || url,
      status: response.status,
      headers: response.headers,
      html: isHtml ? await response.text() : "",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export default router;
