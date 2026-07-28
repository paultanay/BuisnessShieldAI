import type { RequestHandler } from "express";
import crypto from "crypto";
import { eq, and, gt, isNull, or } from "drizzle-orm";
import { db, apiKeysTable } from "@business-shield/db";
import type { RequestWithApiKeyUser } from "../lib/auth";

const API_KEY_PREFIX = "bsa_";

/**
 * Authenticates requests carrying a BusinessShield developer API key
 * (`Authorization: Bearer bsa_...`, created from Settings → Developer).
 *
 * On success, sets `req.apiKeyUserId` so downstream routes (via
 * `getAuthContext`) treat the request as belonging to that user, and
 * records `lastUsedAt`. Requests without a `bsa_` bearer token are passed
 * through untouched so Clerk session auth continues to work as before.
 */
export const apiKeyAuth: RequestHandler = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next();
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token.startsWith(API_KEY_PREFIX)) {
    return next();
  }

  const keyHash = crypto.createHash("sha256").update(token).digest("hex");

  const [match] = await db
    .select({ id: apiKeysTable.id, userId: apiKeysTable.userId })
    .from(apiKeysTable)
    .where(
      and(
        eq(apiKeysTable.keyHash, keyHash),
        eq(apiKeysTable.isActive, true),
        or(isNull(apiKeysTable.expiresAt), gt(apiKeysTable.expiresAt, new Date())),
      ),
    )
    .limit(1);

  if (!match) {
    return res.status(401).json({ error: "Invalid or expired API key" });
  }

  (req as RequestWithApiKeyUser).apiKeyUserId = match.userId;

  db.update(apiKeysTable)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeysTable.id, match.id))
    .catch((err) => req.log?.error({ err }, "Failed to update API key lastUsedAt"));

  next();
};
