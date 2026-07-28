import { Router } from "express";
import { getAuthContext } from "../lib/auth";
import { db, websitesTable, monitoringConfigTable } from "@business-shield/db";
import { eq, and } from "drizzle-orm";
import { UpsertMonitoringConfigBody } from "@business-shield/api-zod";

const router = Router();

router.get("/websites/:websiteId/monitoring", async (req, res) => {
  const { userId } = getAuthContext(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const websiteId = parseInt(req.params.websiteId);
  const [website] = await db
    .select()
    .from(websitesTable)
    .where(and(eq(websitesTable.id, websiteId), eq(websitesTable.userId, userId)));

  if (!website) return res.status(404).json({ error: "Website not found" });

  const [config] = await db
    .select()
    .from(monitoringConfigTable)
    .where(eq(monitoringConfigTable.websiteId, websiteId));

  if (!config) {
    const [created] = await db
      .insert(monitoringConfigTable)
      .values({ websiteId, enabled: false, frequency: "daily", alertChannels: [], emailAlerts: true, sslExpiryWarningDays: 30 })
      .returning();
    return res.json(created);
  }

  return res.json(config);
});

router.put("/websites/:websiteId/monitoring", async (req, res) => {
  const { userId } = getAuthContext(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const websiteId = parseInt(req.params.websiteId);
  const [website] = await db
    .select()
    .from(websitesTable)
    .where(and(eq(websitesTable.id, websiteId), eq(websitesTable.userId, userId)));

  if (!website) return res.status(404).json({ error: "Website not found" });

  const parsed = UpsertMonitoringConfigBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  const existing = await db
    .select()
    .from(monitoringConfigTable)
    .where(eq(monitoringConfigTable.websiteId, websiteId));

  let config;
  if (existing.length > 0) {
    const [updated] = await db
      .update(monitoringConfigTable)
      .set(parsed.data)
      .where(eq(monitoringConfigTable.websiteId, websiteId))
      .returning();
    config = updated;
  } else {
    const [created] = await db
      .insert(monitoringConfigTable)
      .values({ websiteId, enabled: false, frequency: "daily", alertChannels: [], emailAlerts: true, sslExpiryWarningDays: 30, ...parsed.data })
      .returning();
    config = created;
  }

  await db
    .update(websitesTable)
    .set({ monitoringEnabled: config.enabled })
    .where(eq(websitesTable.id, websiteId));

  return res.json(config);
});

export default router;
