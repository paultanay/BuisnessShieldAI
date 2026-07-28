import { type Request, type Response, type NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { db, auditLogsTable } from "@business-shield/db";

const AUDITED_ROUTES: { method: string; pattern: RegExp; action: string; resource: string }[] = [
  { method: "POST",   pattern: /^\/api\/websites$/,                     action: "website.create",   resource: "website" },
  { method: "DELETE", pattern: /^\/api\/websites\/\d+$/,                action: "website.delete",   resource: "website" },
  { method: "POST",   pattern: /^\/api\/websites\/\d+\/scans$/,          action: "scan.trigger",     resource: "scan" },
  { method: "POST",   pattern: /^\/api\/policies\/generate$/,            action: "policy.generate",  resource: "policy" },
  { method: "DELETE", pattern: /^\/api\/policies\/\d+$/,                 action: "policy.delete",    resource: "policy" },
  { method: "POST",   pattern: /^\/api\/reports\/scans\/\d+\/report$/,   action: "report.generate",  resource: "report" },
  { method: "POST",   pattern: /^\/api\/team\/members$/,                 action: "team.invite",      resource: "team_member" },
  { method: "DELETE", pattern: /^\/api\/team\/members\/\d+$/,            action: "team.remove",      resource: "team_member" },
  { method: "POST",   pattern: /^\/api\/developer\/keys$/,               action: "api_key.create",   resource: "api_key" },
  { method: "DELETE", pattern: /^\/api\/developer\/keys\/\d+$/,          action: "api_key.revoke",   resource: "api_key" },
  { method: "POST",   pattern: /^\/api\/ai\/conversations$/,             action: "ai.conversation",  resource: "conversation" },
  { method: "POST",   pattern: /^\/api\/ai\/analyze-scan\/\d+$/,         action: "ai.scan_analysis", resource: "scan" },
];

export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  const match = AUDITED_ROUTES.find(
    (r) => r.method === req.method && r.pattern.test(req.path)
  );
  if (!match) return next();

  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const { userId } = getAuth(req);
      if (userId) {
        const resourceId = body?.id != null ? String(body.id) : undefined;
        db.insert(auditLogsTable)
          .values({
            userId,
            action: match.action,
            resource: match.resource,
            resourceId,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.headers["user-agent"],
            metadata: { method: req.method, path: req.path, status: res.statusCode },
          })
          .catch(() => {});
      }
    }
    return originalJson(body);
  };

  next();
}
