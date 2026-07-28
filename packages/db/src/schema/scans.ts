import { pgTable, text, serial, timestamp, integer, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scansTable = pgTable("scans", {
  id: serial("id").primaryKey(),
  websiteId: integer("website_id").notNull(),
  status: text("status").notNull().default("queued"),
  scanTypes: json("scan_types").$type<string[]>().notNull().default(["accessibility", "ssl", "security", "privacy", "seo", "performance"]),
  riskScore: integer("risk_score"),
  complianceScore: integer("compliance_score"),
  summary: text("summary"),
  findingsCount: integer("findings_count"),
  criticalCount: integer("critical_count"),
  highCount: integer("high_count"),
  mediumCount: integer("medium_count"),
  lowCount: integer("low_count"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertScanSchema = createInsertSchema(scansTable).omit({ id: true, createdAt: true });
export type InsertScan = z.infer<typeof insertScanSchema>;
export type Scan = typeof scansTable.$inferSelect;
