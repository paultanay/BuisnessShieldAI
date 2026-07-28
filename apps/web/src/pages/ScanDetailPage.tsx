import { useState } from "react";
import { useParams, Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetScan, useListFindings } from "@business-shield/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { SeverityBadge, StatusBadge } from "@/components/shared/SeverityBadge";
import {
  ArrowLeft, AlertTriangle, ShieldCheck, Activity,
  Loader2, CheckCircle2, Zap, ChevronDown, ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

export function ScanDetailPage() {
  const { id, scanId } = useParams();
  const parsedScanId = parseInt(scanId || "0", 10);
  const websiteId = parseInt(id || "0", 10);
  const { toast } = useToast();

  const queryClient = useQueryClient();

  const { data: scan, isLoading: loadingScan } = useGetScan(parsedScanId, {
    query: { enabled: !!parsedScanId, queryKey: ["getScan", parsedScanId] },
  });
  const { data: findings, isLoading: loadingFindings } = useListFindings(parsedScanId, {
    query: { enabled: !!parsedScanId, queryKey: ["listFindings", parsedScanId] },
  });

  function invalidateFindings() {
    queryClient.invalidateQueries({ queryKey: ["listFindings", parsedScanId] });
  }

  const categories = findings ? Array.from(new Set(findings.map((f) => f.category))) : [];

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Back + header */}
        <div>
          <Link
            href={`/websites/${websiteId}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Website
          </Link>
          <PageHeader
            title="Scan Results"
            description={scan ? `Completed ${new Date(scan.createdAt).toLocaleString()}` : "Loading..."}
            actions={scan ? <StatusBadge status={scan.status} /> : null}
          />
        </div>

        {/* Score cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Compliance Score",
              value: scan?.complianceScore != null ? `${Math.round(scan.complianceScore)}%` : "--",
              icon: ShieldCheck,
              color: scan?.complianceScore != null && scan.complianceScore > 80 ? "text-emerald-400" : "text-amber-400",
              bg: "bg-emerald-400/10",
            },
            {
              label: "Risk Score",
              value: scan?.riskScore != null ? Math.round(scan.riskScore) : "--",
              icon: Activity,
              color: scan?.riskScore != null && scan.riskScore < 30 ? "text-emerald-400" : "text-red-400",
              bg: "bg-red-400/10",
            },
            {
              label: "Total Issues",
              value: scan?.findingsCount ?? "--",
              icon: AlertTriangle,
              color: "text-foreground",
              bg: "bg-muted/50",
            },
            {
              label: "Critical",
              value: scan?.criticalCount ?? 0,
              icon: Zap,
              color: "text-red-400",
              bg: "bg-red-400/10",
            },
          ].map((card) => (
            <Card key={card.label} className="bg-card/50">
              <CardContent className="p-5">
                {loadingScan ? (
                  <Skeleton className="h-10 w-24 mt-1" />
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground">{card.label}</p>
                      <div className={`rounded-lg p-1.5 ${card.bg}`}>
                        <card.icon className={`h-3.5 w-3.5 ${card.color}`} />
                      </div>
                    </div>
                    <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Breakdown badges */}
        {scan && (
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Critical", count: scan.criticalCount, color: "text-red-400 bg-red-400/10 border-red-400/20" },
              { label: "High", count: scan.highCount, color: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
              { label: "Medium", count: scan.mediumCount, color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
              { label: "Low", count: scan.lowCount, color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
            ].map((s) => (
              <span key={s.label} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${s.color}`}>
                {s.count ?? 0} {s.label}
              </span>
            ))}
          </div>
        )}

        {/* Findings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-primary" />
              Detailed Findings
            </CardTitle>
            <CardDescription>All issues detected during this scan, grouped by category</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingFindings ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            ) : findings && findings.length > 0 ? (
              <Tabs defaultValue="all">
                <TabsList className="mb-4 flex flex-wrap h-auto p-1 gap-1">
                  <TabsTrigger value="all">All ({findings.length})</TabsTrigger>
                  {categories.map((cat) => (
                    <TabsTrigger key={cat} value={cat} className="capitalize">
                      {cat} ({findings.filter((f) => f.category === cat).length})
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="all" className="m-0">
                  <div className="space-y-3">
                    {findings.map((f, i) => <FindingCard key={f.id} finding={f} index={i} onFixed={invalidateFindings} />)}
                  </div>
                </TabsContent>
                {categories.map((cat) => (
                  <TabsContent key={cat} value={cat} className="m-0">
                    <div className="space-y-3">
                      {findings.filter((f) => f.category === cat).map((f, i) => (
                        <FindingCard key={f.id} finding={f} index={i} onFixed={invalidateFindings} />
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <div className="text-center py-16">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-400/10 mx-auto mb-4">
                  <ShieldCheck className="h-8 w-8 text-emerald-400" />
                </div>
                <p className="text-lg font-semibold text-emerald-400 mb-1">Clean Bill of Health!</p>
                <p className="text-sm text-muted-foreground">No issues found. Your website is fully compliant.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function FindingCard({ finding, index, onFixed }: { finding: any; index: number; onFixed: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [fixing, setFixing] = useState(false);
  const { toast } = useToast();

  async function handleMarkFixed(e: React.MouseEvent) {
    e.stopPropagation();
    setFixing(true);
    try {
      const res = await fetch(`${BASE_URL}/api/findings/${finding.id}/fix`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to mark as fixed");
      toast({ title: "Marked as fixed", description: "Finding has been resolved." });
      onFixed();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setFixing(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`rounded-xl border transition-colors ${
        finding.isFixed ? "border-green-500/20 bg-green-500/5" : "border-border bg-card/50 hover:bg-muted/10"
      }`}
    >
      <div
        className="flex items-start justify-between gap-4 p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <SeverityBadge severity={finding.severity} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h4 className="text-sm font-semibold truncate">{finding.title}</h4>
              <Badge variant="outline" className="text-[10px] capitalize flex-shrink-0">{finding.category}</Badge>
              {finding.wcagCriteria && (
                <Badge variant="outline" className="text-[10px] flex-shrink-0">{finding.wcagCriteria}</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">{finding.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {finding.isFixed ? (
            <Badge className="text-xs bg-green-500/10 text-green-400 border-green-500/20">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Fixed
            </Badge>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-7 px-2 text-muted-foreground hover:text-green-400"
              disabled={fixing}
              onClick={handleMarkFixed}
            >
              {fixing ? <Loader2 className="h-3 w-3 animate-spin" /> : "Mark Fixed"}
            </Button>
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
              <p className="text-sm text-muted-foreground leading-relaxed">{finding.description}</p>

              {finding.recommendation && (
                <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                  <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1.5">
                    <Zap className="h-3 w-3" /> Recommendation
                  </p>
                  <p className="text-sm text-foreground/80">{finding.recommendation}</p>
                </div>
              )}

              {finding.element && (
                <div className="rounded-lg bg-muted/50 border border-border p-2">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Affected Element</p>
                  <code className="text-xs font-mono text-foreground/80 break-all">{finding.element}</code>
                </div>
              )}

              {finding.codeSnippet && (
                <div className="rounded-lg bg-muted/40 border border-border overflow-hidden">
                  <div className="px-3 py-1.5 border-b border-border flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-red-500/60" />
                    <div className="h-2 w-2 rounded-full bg-yellow-500/60" />
                    <div className="h-2 w-2 rounded-full bg-green-500/60" />
                    <span className="text-xs text-muted-foreground ml-1">Code</span>
                  </div>
                  <pre className="p-3 text-xs font-mono text-foreground/80 overflow-x-auto">
                    <code>{finding.codeSnippet}</code>
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
