import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scanFindingsTable = pgTable("scan_findings", {
  id: serial("id").primaryKey(),
  scanId: integer("scan_id").notNull(),
  category: text("category").notNull(),
  severity: text("severity").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  recommendation: text("recommendation"),
  codeSnippet: text("code_snippet"),
  wcagCriteria: text("wcag_criteria"),
  element: text("element"),
  isFixed: boolean("is_fixed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertScanFindingSchema = createInsertSchema(scanFindingsTable).omit({ id: true, createdAt: true });
export type InsertScanFinding = z.infer<typeof insertScanFindingSchema>;
export type ScanFinding = typeof scanFindingsTable.$inferSelect;
