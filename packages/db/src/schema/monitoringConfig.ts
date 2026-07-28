import { pgTable, text, serial, timestamp, integer, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const monitoringConfigTable = pgTable("monitoring_config", {
  id: serial("id").primaryKey(),
  websiteId: integer("website_id").notNull().unique(),
  enabled: boolean("enabled").notNull().default(false),
  frequency: text("frequency").notNull().default("daily"),
  alertChannels: json("alert_channels").$type<string[]>().notNull().default([]),
  emailAlerts: boolean("email_alerts").notNull().default(true),
  slackWebhookUrl: text("slack_webhook_url"),
  discordWebhookUrl: text("discord_webhook_url"),
  sslExpiryWarningDays: integer("ssl_expiry_warning_days").notNull().default(30),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertMonitoringConfigSchema = createInsertSchema(monitoringConfigTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMonitoringConfig = z.infer<typeof insertMonitoringConfigSchema>;
export type MonitoringConfig = typeof monitoringConfigTable.$inferSelect;
