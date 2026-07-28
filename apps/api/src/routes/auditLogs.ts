import { Router } from "express";
import { getAuthContext } from "../lib/auth";
import { db, auditLogsTable } from "@business-shield/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const { userId } = getAuthContext(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
  const offset = parseInt(req.query.offset as string) || 0;

  const logs = await db
    .select()
    .from(auditLogsTable)
    .where(eq(auditLogsTable.userId, userId))
    .orderBy(desc(auditLogsTable.createdAt))
    .limit(limit)
    .offset(offset);

  return res.json(logs);
});

export default router;
