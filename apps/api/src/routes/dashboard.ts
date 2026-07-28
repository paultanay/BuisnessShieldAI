import { Router } from "express";
import { getAuthContext } from "../lib/auth";
import { db, websitesTable, scansTable, alertsTable, scanFindingsTable } from "@business-shield/db";
import { eq, and, desc, count, gte, lt, isNotNull, inArray } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/summary", async (req, res) => {
  const { userId } = getAuthContext(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const websites = await db
    .select()
    .from(websitesTable)
    .where(eq(websitesTable.userId, userId));

  const totalWebsites = websites.length;
  const activeWebsites = websites.filter(w => w.status === "active").length;

  const scansResult = await db
    .select({ count: count() })
    .from(scansTable)
    .where(sql`${scansTable.websiteId} IN (SELECT id FROM websites WHERE user_id = ${userId})`);

  const totalScans = Number(scansResult[0]?.count ?? 0);

  const riskScores = websites.map(w => w.riskScore).filter(Boolean) as number[];
  const complianceScores = websites.map(w => w.complianceScore).filter(Boolean) as number[];
  const avgRiskScore = riskScores.length > 0 ? Math.round(riskScores.reduce((a, b) => a + b, 0) / riskScores.length) : null;
  const avgComplianceScore = complianceScores.length > 0 ? Math.round(complianceScores.reduce((a, b) => a + b, 0) / complianceScores.length) : null;

  const unreadAlertsResult = await db
    .select({ count: count() })
    .from(alertsTable)
    .where(and(eq(alertsTable.userId, userId), eq(alertsTable.isRead, false)));
  const unreadAlerts = Number(unreadAlertsResult[0]?.count ?? 0);

  const criticalAlertsResult = await db
    .select({ count: count() })
    .from(alertsTable)
    .where(and(eq(alertsTable.userId, userId), eq(alertsTable.severity, "critical"), eq(alertsTable.isRead, false)));
  const criticalIssues = Number(criticalAlertsResult[0]?.count ?? 0);

  const websitesAtRisk = websites.filter(w => (w.riskScore ?? 0) > 60).length;

  const lastScannedWebsite = websites
    .filter(w => w.lastScannedAt)
    .sort((a, b) => new Date(b.lastScannedAt!).getTime() - new Date(a.lastScannedAt!).getTime())[0];

  return res.json({
    totalWebsites,
    activeWebsites,
    totalScans,
    avgRiskScore,
    avgComplianceScore,
    unreadAlerts,
    criticalIssues,
    websitesAtRisk,
    lastScanAt: lastScannedWebsite?.lastScannedAt ?? null,
  });
});

router.get("/activity", async (req, res) => {
  const { userId } = getAuthContext(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

  const alerts = await db
    .select()
    .from(alertsTable)
    .where(eq(alertsTable.userId, userId))
    .orderBy(desc(alertsTable.createdAt))
    .limit(limit);

  const websiteIds = [...new Set(alerts.map(a => a.websiteId).filter(Boolean))] as number[];
  const websiteMap: Record<number, string> = {};
  if (websiteIds.length > 0) {
    const sites = await db
      .select({ id: websitesTable.id, name: websitesTable.name })
      .from(websitesTable)
      .where(sql`${websitesTable.id} = ANY(ARRAY[${sql.join(websiteIds.map(id => sql`${id}`), sql`, `)}]::int[])`);
    for (const s of sites) websiteMap[s.id] = s.name;
  }

  const activity = alerts.map(alert => ({
    id: alert.id,
    type: alert.type as "scan_complete" | "alert_created" | "report_generated" | "website_added" | "policy_generated",
    title: alert.title,
    description: alert.message,
    websiteId: alert.websiteId,
    websiteName: alert.websiteId ? (websiteMap[alert.websiteId] ?? null) : null,
    severity: alert.severity,
    createdAt: alert.createdAt,
  }));

  return res.json(activity);
});

router.get("/compliance-trend", async (req, res) => {
  const { userId } = getAuthContext(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  // Build 7-day date range
  const days: { date: string; start: Date; end: Date }[] = [];
  for (let i = 6; i >= 0; i--) {
    const start = new Date();
    start.setDate(start.getDate() - i);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    days.push({ date: start.toISOString().split("T")[0], start, end });
  }

  const sevenDaysAgo = days[0].start;

  // Get user's websites
  const websites = await db
    .select({ id: websitesTable.id })
    .from(websitesTable)
    .where(eq(websitesTable.userId, userId));

  const websiteIds = websites.map(w => w.id);

  if (websiteIds.length === 0) {
    return res.json(days.map(d => ({ date: d.date, complianceScore: null, riskScore: null })));
  }

  // Get all completed scans in the last 7 days
  const recentScans = await db
    .select({
      completedAt: scansTable.completedAt,
      complianceScore: scansTable.complianceScore,
      riskScore: scansTable.riskScore,
    })
    .from(scansTable)
    .where(
      and(
        inArray(scansTable.websiteId, websiteIds),
        eq(scansTable.status, "completed"),
        gte(scansTable.completedAt, sevenDaysAgo),
        isNotNull(scansTable.completedAt),
      )
    );

  // Group by date string
  const byDate: Record<string, { compliance: number[]; risk: number[] }> = {};
  for (const scan of recentScans) {
    const dateStr = scan.completedAt!.toISOString().split("T")[0];
    if (!byDate[dateStr]) byDate[dateStr] = { compliance: [], risk: [] };
    if (scan.complianceScore != null) byDate[dateStr].compliance.push(scan.complianceScore);
    if (scan.riskScore != null) byDate[dateStr].risk.push(scan.riskScore);
  }

  // If no scans at all in range, fall back to current website scores
  const hasAnyScanData = recentScans.length > 0;
  let lastKnownCompliance: number | null = null;
  let lastKnownRisk: number | null = null;

  if (!hasAnyScanData) {
    // Use the most recent scan overall as baseline
    const latestScans = await db
      .select({ complianceScore: scansTable.complianceScore, riskScore: scansTable.riskScore })
      .from(scansTable)
      .where(and(inArray(scansTable.websiteId, websiteIds), eq(scansTable.status, "completed")))
      .orderBy(desc(scansTable.completedAt))
      .limit(1);

    if (latestScans[0]) {
      lastKnownCompliance = latestScans[0].complianceScore;
      lastKnownRisk = latestScans[0].riskScore;
    }
  }

  const trend = days.map(d => {
    const entry = byDate[d.date];
    if (entry && entry.compliance.length > 0) {
      const avg = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
      const complianceScore = avg(entry.compliance);
      const riskScore = entry.risk.length > 0 ? avg(entry.risk) : null;
      lastKnownCompliance = complianceScore;
      lastKnownRisk = riskScore;
      return { date: d.date, complianceScore, riskScore };
    }
    // Carry forward last known value
    return {
      date: d.date,
      complianceScore: lastKnownCompliance,
      riskScore: lastKnownRisk,
    };
  });

  return res.json(trend);
});

router.get("/risk-breakdown", async (req, res) => {
  const { userId } = getAuthContext(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const websites = await db
    .select({ id: websitesTable.id })
    .from(websitesTable)
    .where(eq(websitesTable.userId, userId));

  const websiteIds = websites.map(w => w.id);

  const CATEGORY_LABELS: Record<string, string> = {
    accessibility: "Accessibility",
    security: "Security",
    privacy: "Privacy",
    ssl: "SSL/TLS",
    seo: "SEO Trust",
    performance: "Performance",
    legal: "Legal",
    gdpr: "Privacy",
    hipaa: "Healthcare Compliance",
    pci: "Payment Security",
  };

  const ALL_CATEGORIES = ["Accessibility", "Security", "Privacy", "SSL/TLS", "SEO Trust", "Performance", "Legal"];

  if (websiteIds.length === 0) {
    return res.json(ALL_CATEGORIES.map(cat => ({ category: cat, score: null, issueCount: 0, change: 0 })));
  }

  // Get all findings from all completed scans for user's websites
  const findings = await db
    .select({
      category: scanFindingsTable.category,
      severity: scanFindingsTable.severity,
    })
    .from(scanFindingsTable)
    .innerJoin(scansTable, eq(scanFindingsTable.scanId, scansTable.id))
    .where(
      and(
        inArray(scansTable.websiteId, websiteIds),
        eq(scansTable.status, "completed"),
      )
    );

  if (findings.length === 0) {
    return res.json(ALL_CATEGORIES.map(cat => ({ category: cat, score: null, issueCount: 0, change: 0 })));
  }

  const SEVERITY_PENALTY: Record<string, number> = {
    critical: 30,
    high: 15,
    medium: 7,
    low: 3,
  };

  // Group findings by normalized category
  const grouped: Record<string, { issues: number; penalty: number }> = {};
  for (const f of findings) {
    const rawCat = f.category?.toLowerCase() ?? "security";
    const label = CATEGORY_LABELS[rawCat] ?? (rawCat.charAt(0).toUpperCase() + rawCat.slice(1));
    if (!grouped[label]) grouped[label] = { issues: 0, penalty: 0 };
    grouped[label].issues++;
    grouped[label].penalty += SEVERITY_PENALTY[f.severity] ?? 7;
  }

  // Calculate score (100 = no issues, decreases with findings)
  const breakdown = ALL_CATEGORIES.map(cat => {
    const data = grouped[cat];
    if (!data) {
      return { category: cat, score: 100, issueCount: 0, change: 0 };
    }
    // Score: start at 100, subtract penalties, floor at 0
    const score = Math.max(0, Math.min(100, 100 - data.penalty));
    return {
      category: cat,
      score,
      issueCount: data.issues,
      change: 0,
    };
  });

  return res.json(breakdown);
});

export default router;
