import type { Request } from "express";
import { getAuth } from "@clerk/express";

export interface RequestWithApiKeyUser extends Request {
  apiKeyUserId?: string;
}

/**
 * Resolves the authenticated userId for a request, accepting either:
 * - A Clerk session (browser app usage)
 * - A BusinessShield API key sent as `Authorization: Bearer bsa_...`
 *   (external integrations, set by `apiKeyAuth` middleware in app.ts)
 *
 * Use this instead of calling `getAuth(req)` directly in route handlers so
 * that generated developer API keys actually authenticate requests.
 */
export function getAuthContext(req: Request): { userId: string | null } {
  const apiKeyUserId = (req as RequestWithApiKeyUser).apiKeyUserId;
  if (apiKeyUserId) {
    return { userId: apiKeyUserId };
  }
  return { userId: getAuth(req).userId ?? null };
}
