import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const websitesTable = pgTable("websites", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  url: text("url").notNull(),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"),
  riskScore: integer("risk_score"),
  complianceScore: integer("compliance_score"),
  lastScannedAt: timestamp("last_scanned_at", { withTimezone: true }),
  nextScanAt: timestamp("next_scan_at", { withTimezone: true }),
  monitoringEnabled: boolean("monitoring_enabled").notNull().default(false),
  scanFrequency: text("scan_frequency"),
  sslExpiresAt: timestamp("ssl_expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertWebsiteSchema = createInsertSchema(websitesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWebsite = z.infer<typeof insertWebsiteSchema>;
export type Website = typeof websitesTable.$inferSelect;
