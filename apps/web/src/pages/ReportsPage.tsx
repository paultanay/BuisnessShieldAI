import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  useListReports, useGenerateReport, useListWebsites, useListScans,
  getListReportsQueryKey,
} from "@business-shield/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/SeverityBadge";
import { FileText, Download, Eye, Loader2, Plus, BarChart3, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

function ScanPickerSelect({
  websiteId,
  value,
  onChange,
}: {
  websiteId: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const parsedId = parseInt(websiteId);
  const { data: scans = [], isLoading } = useListScans(parsedId, {
    query: { enabled: !!websiteId && !isNaN(parsedId), queryKey: ["listScans", parsedId] },
  });
  const completed = scans.filter((s) => s.status === "completed");

  return (
    <Select value={value} onValueChange={onChange} disabled={!websiteId || isLoading}>
      <SelectTrigger>
        <SelectValue placeholder={!websiteId ? "Select a website first" : isLoading ? "Loading scans..." : "Select a scan"} />
      </SelectTrigger>
      <SelectContent>
        {completed.length === 0 ? (
          <SelectItem value="__empty__" disabled>No completed scans</SelectItem>
        ) : (
          completed.map((s) => (
            <SelectItem key={s.id} value={String(s.id)}>
              Scan #{s.id} - {new Date(s.createdAt).toLocaleDateString()} (Score: {s.complianceScore ?? "--"})
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

export function ReportsPage() {
  const { data: reports, isLoading } = useListReports();
  const { data: websites = [] } = useListWebsites();
  const [open, setOpen] = useState(false);
  const [selectedWebsite, setSelectedWebsite] = useState("");
  const [selectedScan, setSelectedScan] = useState("");
  const [viewOpen, setViewOpen] = useState(false);
  const [viewReport, setViewReport] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  function handleView(report: any) {
    setViewReport(report);
    setViewOpen(true);
  }

  function handleDownload(report: any) {
    const lines: string[] = [
      report.title,
      "=".repeat(report.title.length),
      "",
      `Generated: ${new Date(report.createdAt).toLocaleString()}`,
      report.riskScore !== null ? `Risk Score: ${report.riskScore}/100` : "",
      report.complianceScore !== null ? `Compliance Score: ${report.complianceScore}%` : "",
      "",
    ].filter((l) => l !== undefined);

    if (report.executiveSummary) {
      lines.push("EXECUTIVE SUMMARY", "-".repeat(20), report.executiveSummary, "");
    }
    if (report.recommendations) {
      lines.push("FULL REPORT", "-".repeat(20), report.recommendations);
    }

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(report.title || "report").replace(/\s+/g, "-").toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: `${report.title} saved as .txt` });
  }

  const generateReport = useGenerateReport({
    mutation: {
      onSuccess: () => {
        toast({ title: "Report generation started", description: "Your report will be ready in moments." });
        queryClient.invalidateQueries({ queryKey: getListReportsQueryKey() });
        setOpen(false);
        setSelectedWebsite("");
        setSelectedScan("");
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      },
    },
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(selectedScan, 10);
    if (!id) return;
    generateReport.mutate({ id });
  };

  const handleWebsiteChange = (v: string) => {
    setSelectedWebsite(v);
    setSelectedScan("");
  };

  const readyCount = reports?.filter((r) => r.status === "ready").length || 0;
  const pendingCount = reports?.filter((r) => r.status !== "ready").length || 0;

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        <PageHeader
          title="Executive Reports"
          description="Evidence-backed compliance summaries for stakeholders, boards, and auditors."
          actions={
            <Button onClick={() => setOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Generate Report
            </Button>
          }
        />

        {/* Stats bar */}
        {reports && reports.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: FileText, label: "Total Reports", value: reports.length, color: "text-primary" },
              { icon: CheckCircle2, label: "Ready", value: readyCount, color: "text-green-400" },
              { icon: Clock, label: "Generating", value: pendingCount, color: "text-amber-400" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-card/50 p-4 flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Generate dialog */}
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setSelectedWebsite(""); setSelectedScan(""); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Generate Executive Report
              </DialogTitle>
              <DialogDescription>
                Select a completed scan to generate a comprehensive compliance report.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleGenerate} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Website</Label>
                <Select value={selectedWebsite} onValueChange={handleWebsiteChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a website..." />
                  </SelectTrigger>
                  <SelectContent>
                    {websites.length === 0 ? (
                      <SelectItem value="__empty__" disabled>No websites added</SelectItem>
                    ) : (
                      websites.map((w) => (
                        <SelectItem key={w.id} value={String(w.id)}>
                          {w.name} - {w.url}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Scan</Label>
                <ScanPickerSelect
                  websiteId={selectedWebsite}
                  value={selectedScan}
                  onChange={setSelectedScan}
                />
                {!selectedWebsite && (
                  <p className="text-xs text-muted-foreground">Select a website to see available scans</p>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={!selectedScan || generateReport.isPending} className="gap-2">
                  {generateReport.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Generate Report
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Report Dialog */}
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {viewReport?.title}
              </DialogTitle>
              <DialogDescription>
                Generated {viewReport && new Date(viewReport.createdAt).toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
              {(viewReport?.riskScore !== null || viewReport?.complianceScore !== null) && (
                <div className="flex gap-3 flex-wrap">
                  {viewReport?.riskScore !== null && (
                    <Badge variant="outline">Risk: {viewReport?.riskScore}/100</Badge>
                  )}
                  {viewReport?.complianceScore !== null && (
                    <Badge variant="outline" className="text-green-400 border-green-400/30">
                      Compliance: {viewReport?.complianceScore}%
                    </Badge>
                  )}
                </div>
              )}
              {viewReport?.executiveSummary && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Executive Summary</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{viewReport.executiveSummary}</p>
                </div>
              )}
              {viewReport?.recommendations && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Full Report</p>
                  <div className="rounded-xl bg-muted/30 border border-border p-4">
                    <pre className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed font-mono">
                      {viewReport.recommendations}
                    </pre>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button>
              <Button onClick={() => viewReport && handleDownload(viewReport)} className="gap-2">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reports grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))
          ) : reports && reports.length > 0 ? (
            reports.map((report, i) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <Card className="hover:border-primary/40 transition-colors flex flex-col h-full">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-400" />
                      </div>
                      <StatusBadge status={report.status} />
                    </div>

                    <h3 className="font-semibold mb-1 line-clamp-2">{report.title}</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      {new Date(report.createdAt).toLocaleDateString("en-US", {
                        month: "long", day: "numeric", year: "numeric",
                      })}
                    </p>

                    {report.riskScore !== null && (
                      <div className="flex gap-3 mb-4">
                        <Badge variant="outline" className="text-xs">
                          Risk: {report.riskScore}
                        </Badge>
                        {report.complianceScore !== null && (
                          <Badge variant="outline" className="text-xs text-green-400 border-green-400/30">
                            Compliance: {report.complianceScore}%
                          </Badge>
                        )}
                      </div>
                    )}

                    {report.executiveSummary && (
                      <p className="text-xs text-muted-foreground line-clamp-3 mb-4 flex-1">
                        {report.executiveSummary}
                      </p>
                    )}

                    <div className="mt-auto flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 gap-2"
                        disabled={report.status !== "ready"}
                        onClick={() => report.status === "ready" && handleView(report)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={report.status !== "ready"}
                        className="flex-shrink-0"
                        onClick={() => report.status === "ready" && handleDownload(report)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 border border-dashed border-border rounded-2xl bg-card/30">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/30 mx-auto mb-4">
                <FileText className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No reports yet</h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                Generate executive compliance reports from your scans for board presentations and audits.
              </p>
              <Button onClick={() => setOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Generate First Report
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
