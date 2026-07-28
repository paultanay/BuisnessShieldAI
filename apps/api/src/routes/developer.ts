import { Router } from "express";
import { getAuthContext } from "../lib/auth";
import { db, apiKeysTable } from "@business-shield/db";
import { eq, and, desc } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

function generateApiKey(): { key: string; prefix: string; hash: string } {
  const key = `bsa_${crypto.randomBytes(32).toString("hex")}`;
  const prefix = key.slice(0, 12);
  const hash = crypto.createHash("sha256").update(key).digest("hex");
  return { key, prefix, hash };
}

router.get("/keys", async (req, res) => {
  const { userId } = getAuthContext(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const keys = await db
    .select({
      id: apiKeysTable.id,
      name: apiKeysTable.name,
      keyPrefix: apiKeysTable.keyPrefix,
      isActive: apiKeysTable.isActive,
      lastUsedAt: apiKeysTable.lastUsedAt,
      expiresAt: apiKeysTable.expiresAt,
      createdAt: apiKeysTable.createdAt,
    })
    .from(apiKeysTable)
    .where(and(eq(apiKeysTable.userId, userId), eq(apiKeysTable.isActive, true)))
    .orderBy(desc(apiKeysTable.createdAt));

  return res.json(keys);
});

router.post("/keys", async (req, res) => {
  const { userId } = getAuthContext(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { name, expiresAt } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Name required" });

  const { key, prefix, hash } = generateApiKey();

  const [created] = await db
    .insert(apiKeysTable)
    .values({
      userId,
      name,
      keyHash: hash,
      keyPrefix: prefix,
      isActive: true,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    })
    .returning({
      id: apiKeysTable.id,
      name: apiKeysTable.name,
      keyPrefix: apiKeysTable.keyPrefix,
      isActive: apiKeysTable.isActive,
      createdAt: apiKeysTable.createdAt,
    });

  return res.status(201).json({ ...created, key });
});

router.delete("/keys/:id", async (req, res) => {
  const { userId } = getAuthContext(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const id = parseInt(req.params.id);
  await db
    .update(apiKeysTable)
    .set({ isActive: false })
    .where(and(eq(apiKeysTable.id, id), eq(apiKeysTable.userId, userId)));

  return res.status(204).send();
});

export default router;
