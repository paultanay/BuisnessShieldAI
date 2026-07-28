import { Router } from "express";
import { getAuthContext } from "../lib/auth";
import { db, teamMembersTable } from "@business-shield/db";
import { eq, and, desc } from "drizzle-orm";
import { InviteTeamMemberBody } from "@business-shield/api-zod";

const router = Router();

router.get("/members", async (req, res) => {
  const { userId } = getAuthContext(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const members = await db
    .select()
    .from(teamMembersTable)
    .where(eq(teamMembersTable.ownerId, userId))
    .orderBy(desc(teamMembersTable.createdAt));

  return res.json(members);
});

router.post("/members", async (req, res) => {
  const { userId } = getAuthContext(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = InviteTeamMemberBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  const { email, role } = parsed.data;
  const name = email.split("@")[0];

  const [member] = await db
    .insert(teamMembersTable)
    .values({
      userId: `pending_${Date.now()}`,
      ownerId: userId,
      email,
      name,
      role,
      status: "invited",
    })
    .returning();

  return res.status(201).json(member);
});

router.delete("/members/:id", async (req, res) => {
  const { userId } = getAuthContext(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const id = parseInt(req.params.id);
  await db
    .delete(teamMembersTable)
    .where(and(eq(teamMembersTable.id, id), eq(teamMembersTable.ownerId, userId)));

  return res.status(204).send();
});

export default router;
