import { Router } from "express";
import { getAuthContext } from "../lib/auth";
import { db, alertsTable } from "@business-shield/db";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const { userId } = getAuthContext(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const alerts = await db
    .select()
    .from(alertsTable)
    .where(eq(alertsTable.userId, userId))
    .orderBy(desc(alertsTable.createdAt))
    .limit(100);

  return res.json(alerts);
});

router.patch("/:id/read", async (req, res) => {
  const { userId } = getAuthContext(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const id = parseInt(req.params.id);
  const [updated] = await db
    .update(alertsTable)
    .set({ isRead: true })
    .where(and(eq(alertsTable.id, id), eq(alertsTable.userId, userId)))
    .returning();

  if (!updated) return res.status(404).json({ error: "Not found" });
  return res.json(updated);
});

router.post("/read-all", async (req, res) => {
  const { userId } = getAuthContext(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const result = await db
    .update(alertsTable)
    .set({ isRead: true })
    .where(and(eq(alertsTable.userId, userId), eq(alertsTable.isRead, false)))
    .returning();

  return res.json({ count: result.length });
});

export default router;
