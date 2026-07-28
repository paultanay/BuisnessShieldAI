import { Router } from "express";
import { getAuthContext } from "../lib/auth";
import { db, reportsTable, scansTable, scanFindingsTable, websitesTable, alertsTable, organizationsTable } from "@business-shield/db";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const { userId } = getAuthContext(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const reports = await db
    .select()
    .from(reportsTable)
    .where(eq(reportsTable.userId, userId))
    .orderBy(desc(reportsTable.createdAt));

  return res.json(reports);
});

router.get("/:id", async (req, res) => {
  const { userId } = getAuthContext(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const id = parseInt(req.params.id);
  const [report] = await db
    .select()
    .from(reportsTable)
    .where(and(eq(reportsTable.id, id), eq(reportsTable.userId, userId)));

  if (!report) return res.status(404).json({ error: "Not found" });
  return res.json(report);
});

router.post("/scans/:scanId/report", async (req, res) => {
  const { userId } = getAuthContext(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const scanId = parseInt(req.params.scanId);
  const [scan] = await db.select().from(scansTable).where(eq(scansTable.id, scanId));
  if (!scan) return res.status(404).json({ error: "Scan not found" });

  const [website] = await db
    .select()
    .from(websitesTable)
    .where(and(eq(websitesTable.id, scan.websiteId), eq(websitesTable.userId, userId)));
  if (!website) return res.status(403).json({ error: "Forbidden" });

  const [report] = await db
    .insert(reportsTable)
    .values({
      userId,
      scanId,
      websiteId: scan.websiteId,
      title: `Compliance Report — ${website.name} (${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })})`,
      status: "generating",
    })
    .returning();

  generateReport(report.id, scan, website, userId).catch(() => {});

  return res.status(201).json(report);
});

async function generateReport(reportId: number, scan: any, website: any, userId: string) {
  const findings = await db
    .select()
    .from(scanFindingsTable)
    .where(eq(scanFindingsTable.scanId, scan.id));

  const [org] = await db
    .select()
    .from(organizationsTable)
    .where(eq(organizationsTable.userId, userId));

  const criticalIssues = findings.filter(f => f.severity === "critical");
  const highIssues = findings.filter(f => f.severity === "high");
  const mediumIssues = findings.filter(f => f.severity === "medium");
  const categories = [...new Set(findings.map(f => f.category))];

  const executiveSummary = `This compliance report for **${website.name}** (${website.url}) covers a scan completed on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}. The platform recorded a risk score of **${scan.riskScore}/100** and compliance score of **${scan.complianceScore}/100**.

${findings.length} issues were identified across ${categories.length} categories${criticalIssues.length > 0 ? `, including **${criticalIssues.length} critical issue${criticalIssues.length !== 1 ? "s" : ""}** that require immediate attention` : ""}.

${criticalIssues.length > 0 ? `Critical findings include: ${criticalIssues.slice(0, 3).map(f => f.title).join(", ")}. These represent material legal and operational risk and should be addressed within 24–72 hours.` : "No critical issues were detected. Address high and medium severity findings to improve your overall compliance posture."}

Key categories requiring attention: ${categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(", ")}.`;

  const recLines: string[] = [];

  if (criticalIssues.length > 0) {
    recLines.push("### Priority 1 — Critical (Resolve within 24–72 hours)\n");
    for (const f of criticalIssues) {
      recLines.push(`**${f.title}**\n${f.description}\n\n*Recommended fix:* ${f.recommendation}\n`);
    }
  }

  if (highIssues.length > 0) {
    recLines.push("\n### Priority 2 — High Severity (Resolve within 2 weeks)\n");
    for (const f of highIssues) {
      recLines.push(`**${f.title}**\n${f.description}\n\n*Recommended fix:* ${f.recommendation}\n`);
    }
  }

  recLines.push("\n### Ongoing Improvements\n");
  recLines.push("- Implement automated monitoring to detect compliance drift before it becomes critical.");
  recLines.push("- Establish a recurring scan schedule (weekly for high-risk sites, monthly for stable production sites).");
  recLines.push("- Integrate accessibility testing into your CI/CD pipeline to catch WCAG regressions early.");

  await db
    .update(reportsTable)
    .set({
      status: "ready",
      executiveSummary,
      recommendations: recLines.join("\n"),
      riskScore: scan.riskScore,
      complianceScore: scan.complianceScore,
    })
    .where(eq(reportsTable.id, reportId));

  await db.insert(alertsTable).values({
    userId,
    websiteId: website.id,
    type: "report_generated",
    severity: "info",
    title: "Report Ready",
    message: `Compliance report for ${website.name} is ready to view.`,
  });
}

export default router;
