import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Globe, Shield, FileText, Key, CheckCircle2, GitBranch, Server,
  Sparkles, TrendingUp, Users, Bell, Activity, Lock, Bot,
} from "lucide-react";
import { useListWebsites, useListReports } from "@business-shield/api-client-react";

const ROADMAP = [
  { quarter: "Q3 2025", title: "Core platform", items: ["Multi-website scanning", "WCAG 2.1 AA/AAA checks", "GDPR/CCPA detection", "AI policy generation", "Security headers"], done: true },
  { quarter: "Q4 2025", title: "AI & monitoring", items: ["AI Copilot", "Continuous monitoring", "Executive reports", "Alert system", "Team management"], done: true },
  { quarter: "Q1 2026", title: "Developer tools", items: ["REST API", "Webhook delivery", "CI/CD integration guide", "OpenAPI spec published", "Audit log"], done: true },
  { quarter: "Q3 2026", title: "Advanced compliance", items: ["EU AI Act checks", "SOC 2 evidence collection", "ISO 27001 controls", "HIPAA module (beta)", "SSO/SAML support"], done: false },
];

const OPEN_SOURCE_FEATURES = [
  { icon: GitBranch, color: "text-green-400", bg: "bg-green-400/10", title: "MIT License", desc: "Use it commercially. Fork it. Build on top of it. No restrictions." },
  { icon: Server, color: "text-blue-400", bg: "bg-blue-400/10", title: "Self-hostable", desc: "Deploy on your own infrastructure. Your compliance data never leaves your servers." },
  { icon: Shield, color: "text-violet-400", bg: "bg-violet-400/10", title: "Fully auditable", desc: "Every check is open source code. No black-box decisions about your compliance posture." },
  { icon: Users, color: "text-cyan-400", bg: "bg-cyan-400/10", title: "Community-driven", desc: "Compliance rules are contributed and reviewed by engineers, lawyers, and security researchers." },
  { icon: Bot, color: "text-primary", bg: "bg-primary/10", title: "AI Copilot — included", desc: "Full AI-powered compliance analysis at no cost. No AI add-on tier." },
  { icon: Bell, color: "text-orange-400", bg: "bg-orange-400/10", title: "Monitoring — included", desc: "Continuous scanning, alerting, and dashboards. All included. No upgrade required." },
];

export function BillingPage() {
  const { data: websites = [] } = useListWebsites();
  const { data: reports = [] } = useListReports();

  const USAGE = [
    { label: "Websites", used: websites.length, limit: 50, icon: Globe },
    { label: "Scans (lifetime)", used: websites.reduce((acc, w) => acc + (w.complianceScore !== null ? 1 : 0), 0), limit: null, icon: Shield },
    { label: "Reports generated", used: reports.length, limit: null, icon: FileText },
    { label: "API access", used: null, limit: null, icon: Key, note: "Fully included" },
  ];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-10">
        <PageHeader
          title="Usage & Platform"
          description="Your usage metrics and platform information"
        />

        {/* Open-source banner */}
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
                  <GitBranch className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">Open Source — MIT License</h3>
                    <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">Free forever</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">No plans. No billing. No vendor lock-in. Everything is included.</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-3xl font-bold text-green-400">$0</span>
                <span className="text-xs text-muted-foreground">per month, forever</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage meters */}
        <div>
          <h2 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Your Usage</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {USAGE.map((u, i) => (
              <motion.div
                key={u.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Card>
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <u.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">{u.label}</span>
                    </div>
                    {u.note ? (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                        <span className="text-sm font-medium text-green-400">{u.note}</span>
                      </div>
                    ) : u.limit !== null ? (
                      <>
                        <div className="flex items-end gap-1 mb-2">
                          <span className="text-2xl font-bold">{u.used}</span>
                          <span className="text-sm text-muted-foreground mb-0.5">/ {u.limit}</span>
                        </div>
                        <Progress value={((u.used ?? 0) / u.limit) * 100} className="h-1.5" />
                        <p className="text-xs text-muted-foreground mt-1.5">{u.limit - (u.used ?? 0)} remaining</p>
                      </>
                    ) : (
                      <div className="flex items-end gap-1">
                        <span className="text-2xl font-bold">{u.used ?? 0}</span>
                        <span className="text-xs text-muted-foreground mb-1 ml-1">total</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Everything included */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              Everything is included
            </CardTitle>
            <CardDescription>There are no paid tiers. All features are free and open source.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {OPEN_SOURCE_FEATURES.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${item.bg}`}>
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Roadmap */}
        <div>
          <h2 className="text-sm font-semibold mb-6 text-muted-foreground uppercase tracking-wider">
            Platform Roadmap
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ROADMAP.map((phase, i) => (
              <motion.div
                key={phase.quarter}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`rounded-xl border p-5 ${phase.done ? "border-border bg-card/30" : "border-primary/20 bg-primary/5"}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground font-mono">{phase.quarter}</p>
                    <h3 className="font-semibold text-sm mt-0.5">{phase.title}</h3>
                  </div>
                  {phase.done ? (
                    <Badge variant="outline" className="text-xs border-green-500/30 text-green-400 bg-green-500/5">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Shipped
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5">
                      <Activity className="h-3 w-3 mr-1" /> In progress
                    </Badge>
                  )}
                </div>
                <ul className="space-y-1.5">
                  {phase.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                      {phase.done ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                      ) : (
                        <TrendingUp className="h-3.5 w-3.5 text-primary/60 flex-shrink-0" />
                      )}
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Self-host note */}
        <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/20 p-4">
          <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Want full data sovereignty?</strong>{" "}
            Self-host BusinessShield on your own infrastructure using Docker Compose.
            Visit the <a href="/developer" className="text-primary underline underline-offset-2 hover:text-primary/80">Developer page</a> for deployment instructions.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
