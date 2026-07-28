import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reportsTable = pgTable("reports", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  scanId: integer("scan_id").notNull(),
  websiteId: integer("website_id"),
  title: text("title").notNull(),
  status: text("status").notNull().default("generating"),
  executiveSummary: text("executive_summary"),
  recommendations: text("recommendations"),
  riskScore: integer("risk_score"),
  complianceScore: integer("compliance_score"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertReportSchema = createInsertSchema(reportsTable).omit({ id: true, createdAt: true });
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reportsTable.$inferSelect;
