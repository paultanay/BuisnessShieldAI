import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useListAuditLogs } from "@business-shield/api-client-react";
import { Shield, Search, Activity, User, Globe, Key, FileText, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const ACTION_ICONS: Record<string, any> = {
  scan: Globe,
  website: Globe,
  policy: FileText,
  key: Key,
  team: User,
  alert: Activity,
  report: FileText,
  settings: Settings,
};

const ACTION_COLORS: Record<string, string> = {
  create: "text-green-400 bg-green-400/10",
  delete: "text-red-400 bg-red-400/10",
  update: "text-blue-400 bg-blue-400/10",
  revoke: "text-amber-400 bg-amber-400/10",
  invite: "text-violet-400 bg-violet-400/10",
  run: "text-cyan-400 bg-cyan-400/10",
};

function getActionColor(action: string): string {
  for (const [key, color] of Object.entries(ACTION_COLORS)) {
    if (action.toLowerCase().includes(key)) return color;
  }
  return "text-muted-foreground bg-muted/50";
}

function getActionIcon(action: string, resource: string) {
  const resourceLower = resource.toLowerCase();
  for (const [key, Icon] of Object.entries(ACTION_ICONS)) {
    if (resourceLower.includes(key)) return Icon;
  }
  return Activity;
}

function formatRelative(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const { data: logs = [], isLoading } = useListAuditLogs({});

  const filtered = logs.filter(
    (l) =>
      !search ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.resource.toLowerCase().includes(search.toLowerCase()) ||
      (l.resourceId ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-6">
        <PageHeader
          title="Audit Logs"
          description="Complete history of all actions performed in your account"
        />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Events", value: logs.length, icon: Activity, color: "text-primary" },
            { label: "Today", value: logs.filter(l => {
              const d = new Date(l.createdAt);
              const now = new Date();
              return d.toDateString() === now.toDateString();
            }).length, icon: Shield, color: "text-green-400" },
            { label: "This Week", value: logs.filter(l => {
              const d = new Date(l.createdAt);
              const now = new Date();
              return now.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
            }).length, icon: User, color: "text-blue-400" },
            { label: "Resources", value: new Set(logs.map(l => l.resource)).size, icon: Globe, color: "text-violet-400" },
          ].map((stat) => (
            <Card key={stat.label} className="bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search + table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Event Log
              </CardTitle>
              <div className="relative ml-auto w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search actions or resources…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-8 text-sm"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-0 divide-y divide-border">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-3">
                    <div className="h-8 w-8 rounded-lg bg-muted/30 animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-40 bg-muted/30 rounded animate-pulse" />
                      <div className="h-3 w-24 bg-muted/20 rounded animate-pulse" />
                    </div>
                    <div className="h-3 w-16 bg-muted/20 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <Activity className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {search ? "No matching events" : "No audit events recorded yet"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map((log, i) => {
                  const Icon = getActionIcon(log.action, log.resource);
                  const actionColor = getActionColor(log.action);
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="flex items-center gap-4 px-6 py-3 hover:bg-muted/20 transition-colors"
                    >
                      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${actionColor}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{log.action}</span>
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                            {log.resource}
                          </Badge>
                          {log.resourceId && (
                            <span className="text-xs text-muted-foreground font-mono">
                              #{log.resourceId}
                            </span>
                          )}
                        </div>
                        {log.ipAddress && (
                          <p className="text-xs text-muted-foreground mt-0.5">{log.ipAddress}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatRelative(log.createdAt)}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
