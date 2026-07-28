import { Router } from "express";
import { getAuthContext } from "../lib/auth";
import { db, websitesTable, scansTable, alertsTable } from "@business-shield/db";
import { eq, and, desc } from "drizzle-orm";
import {
  CreateWebsiteBody,
  UpdateWebsiteBody,
} from "@business-shield/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const { userId } = getAuthContext(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const websites = await db
    .select()
    .from(websitesTable)
    .where(eq(websitesTable.userId, userId))
    .orderBy(desc(websitesTable.createdAt));

  return res.json(websites);
});

router.post("/", async (req, res) => {
  const { userId } = getAuthContext(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = CreateWebsiteBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  const { url, name, monitoringEnabled, scanFrequency } = parsed.data;

  const [website] = await db
    .insert(websitesTable)
    .values({ userId, url, name, monitoringEnabled: monitoringEnabled ?? false, scanFrequency: scanFrequency ?? null })
    .returning();

  await db.insert(alertsTable).values({
    userId,
    websiteId: website.id,
    type: "info",
    severity: "info",
    title: "Website Added",
    message: `${name} (${url}) has been added to monitoring.`,
  });

  return res.status(201).json(website);
});

router.get("/:id", async (req, res) => {
  const { userId } = getAuthContext(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const id = parseInt(req.params.id);
  const [website] = await db
    .select()
    .from(websitesTable)
    .where(and(eq(websitesTable.id, id), eq(websitesTable.userId, userId)));

  if (!website) return res.status(404).json({ error: "Not found" });
  return res.json(website);
});

router.patch("/:id", async (req, res) => {
  const { userId } = getAuthContext(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const id = parseInt(req.params.id);
  const parsed = UpdateWebsiteBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  const [updated] = await db
    .update(websitesTable)
    .set(parsed.data)
    .where(and(eq(websitesTable.id, id), eq(websitesTable.userId, userId)))
    .returning();

  if (!updated) return res.status(404).json({ error: "Not found" });
  return res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const { userId } = getAuthContext(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const id = parseInt(req.params.id);
  await db
    .delete(websitesTable)
    .where(and(eq(websitesTable.id, id), eq(websitesTable.userId, userId)));

  return res.status(204).send();
});

export default router;
