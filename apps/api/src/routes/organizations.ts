import { Router } from "express";
import { getAuthContext } from "../lib/auth";
import { db, organizationsTable } from "@business-shield/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/onboarding/status", async (req, res) => {
  const { userId } = getAuthContext(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const [org] = await db
    .select()
    .from(organizationsTable)
    .where(eq(organizationsTable.userId, userId));

  if (!org || !org.onboardingCompletedAt) {
    return res.json({ completed: false });
  }

  return res.json({ completed: true, organization: org });
});

router.post("/onboarding/complete", async (req, res) => {
  const { userId } = getAuthContext(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { name, industry, country, size, primaryConcerns, websiteUrl, timezone } = req.body;

  if (!name || !industry || !country || !size) {
    return res.status(400).json({ error: "name, industry, country, and size are required" });
  }

  const existing = await db
    .select()
    .from(organizationsTable)
    .where(eq(organizationsTable.userId, userId));

  let org;
  if (existing.length > 0) {
    const [updated] = await db
      .update(organizationsTable)
      .set({
        name,
        industry,
        country,
        size,
        primaryConcerns: primaryConcerns ?? [],
        websiteUrl: websiteUrl ?? null,
        timezone: timezone ?? null,
        onboardingCompletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(organizationsTable.userId, userId))
      .returning();
    org = updated;
  } else {
    const [created] = await db
      .insert(organizationsTable)
      .values({
        userId,
        name,
        industry,
        country,
        size,
        primaryConcerns: primaryConcerns ?? [],
        websiteUrl: websiteUrl ?? null,
        timezone: timezone ?? null,
        onboardingCompletedAt: new Date(),
      })
      .returning();
    org = created;
  }

  return res.status(201).json(org);
});

router.get("/organizations/me", async (req, res) => {
  const { userId } = getAuthContext(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const [org] = await db
    .select()
    .from(organizationsTable)
    .where(eq(organizationsTable.userId, userId));

  if (!org) return res.status(404).json({ error: "Organization not found" });

  return res.json(org);
});

router.patch("/organizations/me", async (req, res) => {
  const { userId } = getAuthContext(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { name, industry, country, size, primaryConcerns, websiteUrl, timezone } = req.body;

  const [updated] = await db
    .update(organizationsTable)
    .set({
      ...(name !== undefined && { name }),
      ...(industry !== undefined && { industry }),
      ...(country !== undefined && { country }),
      ...(size !== undefined && { size }),
      ...(primaryConcerns !== undefined && { primaryConcerns }),
      ...(websiteUrl !== undefined && { websiteUrl }),
      ...(timezone !== undefined && { timezone }),
      updatedAt: new Date(),
    })
    .where(eq(organizationsTable.userId, userId))
    .returning();

  if (!updated) return res.status(404).json({ error: "Organization not found" });

  return res.json(updated);
});

export default router;
