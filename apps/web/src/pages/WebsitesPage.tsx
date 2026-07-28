import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useListWebsites, useCreateWebsite, getListWebsitesQueryKey } from "@business-shield/api-client-react";
import { Link } from "wouter";
import { Plus, Globe, Loader2, Activity, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { StatusBadge } from "@/components/shared/SeverityBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";

function getFaviconUrl(url: string) {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch {
    return null;
  }
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width="40" height="40" className="-rotate-90">
      <circle cx="20" cy="20" r={r} stroke="currentColor" strokeWidth="3" fill="none" className="text-muted/30" />
      <circle
        cx="20" cy="20" r={r}
        stroke={color} strokeWidth="3" fill="none"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

export function WebsitesPage() {
  const { data: websites, isLoading } = useListWebsites();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [monitor, setMonitor] = useState(true);
  const [faviconErrors, setFaviconErrors] = useState<Set<number>>(new Set());

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createWebsite = useCreateWebsite({
    mutation: {
      onSuccess: () => {
        toast({ title: "Website added", description: "Open the website profile to run an evidence-based scan." });
        queryClient.invalidateQueries({ queryKey: getListWebsitesQueryKey() });
        setOpen(false);
        setName("");
        setUrl("");
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message || "Failed to add website.", variant: "destructive" });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createWebsite.mutate({ data: { name, url, monitoringEnabled: monitor, scanFrequency: "weekly" } });
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        <PageHeader
          title="Websites"
          description="Track compliance, security, and accessibility posture across your web portfolio."
          actions={
            <Button onClick={() => setOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Website
            </Button>
          }
        />

        {/* Stats bar */}
        {websites && websites.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                icon: CheckCircle2,
                label: "Healthy",
                value: websites.filter((w) => w.complianceScore != null && w.complianceScore >= 80).length,
                color: "text-green-400",
                bg: "bg-green-400/10",
              },
              {
                icon: AlertTriangle,
                label: "Needs Attention",
                value: websites.filter((w) => w.complianceScore != null && w.complianceScore < 80).length,
                color: "text-amber-400",
                bg: "bg-amber-400/10",
              },
              {
                icon: Clock,
                label: "Never Scanned",
                value: websites.filter((w) => !w.lastScannedAt).length,
                color: "text-muted-foreground",
                bg: "bg-muted/40",
              },
            ].map((s) => (
              <div key={s.label} className={`flex items-center gap-3 rounded-xl border border-border p-4 ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
                <div>
                  <p className="text-lg font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Website</DialogTitle>
              <DialogDescription>
                Enter the URL to add it to your portfolio. You can run a scan from the website profile.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Website Name</Label>
                <Input id="name" placeholder="Acme Corp" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input id="url" type="url" placeholder="https://example.com" value={url} onChange={(e) => setUrl(e.target.value)} required />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Switch id="monitor" checked={monitor} onCheckedChange={setMonitor} />
                <Label htmlFor="monitor">Enable monitoring settings</Label>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createWebsite.isPending} className="gap-2">
                  {createWebsite.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Add Website
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Website grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))
          ) : websites && websites.length > 0 ? (
            websites.map((site, i) => {
              const faviconUrl = getFaviconUrl(site.url);
              const faviconBroken = faviconErrors.has(site.id);
              const compliance = site.complianceScore ?? null;
              const risk = site.riskScore ?? null;

              return (
                <motion.div
                  key={site.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link href={`/websites/${site.id}`}>
                    <Card className="hover:border-primary/50 transition-all cursor-pointer overflow-hidden h-full flex flex-col group">
                      <CardContent className="p-5 flex-1 flex flex-col">
                        {/* Header row */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-10 w-10 rounded-xl bg-primary/5 border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {faviconUrl && !faviconBroken ? (
                              <img
                                src={faviconUrl}
                                alt=""
                                className="h-5 w-5 object-contain"
                                onError={() => setFaviconErrors((s) => new Set([...s, site.id]))}
                              />
                            ) : (
                              <Globe className="h-5 w-5 text-primary/60" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold truncate group-hover:text-primary transition-colors">{site.name}</h3>
                            <p className="text-xs text-muted-foreground truncate">{site.url}</p>
                          </div>
                          <StatusBadge status={site.status} />
                        </div>

                        {/* Score rings */}
                        <div className="flex items-center justify-around p-4 rounded-xl bg-muted/20 border border-border/50 mb-4">
                          <div className="flex flex-col items-center gap-1">
                            <div className="relative">
                              <ScoreRing
                                score={compliance ?? 0}
                                color={compliance != null && compliance >= 80 ? "#34d399" : "#fbbf24"}
                              />
                              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold rotate-90">
                                {compliance != null ? Math.round(compliance) : "--"}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">Compliance</p>
                          </div>
                          <div className="h-8 w-px bg-border" />
                          <div className="flex flex-col items-center gap-1">
                            <div className="relative">
                              <ScoreRing
                                score={risk ?? 0}
                                color={risk != null && risk < 30 ? "#34d399" : "#f87171"}
                              />
                              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold rotate-90">
                                {risk != null ? Math.round(risk) : "--"}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">Risk</p>
                          </div>
                          <div className="h-8 w-px bg-border" />
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex h-10 w-10 items-center justify-center">
                              <Activity className={`h-5 w-5 ${site.monitoringEnabled ? "text-green-400" : "text-muted-foreground/30"}`} />
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              {site.monitoringEnabled ? "Monitored" : "Paused"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-auto text-xs text-muted-foreground">
                          Last scan:{" "}
                          <span className="text-foreground font-medium">
                            {site.lastScannedAt
                              ? new Date(site.lastScannedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                              : "Never"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full py-20 text-center border border-dashed border-border rounded-2xl bg-card/30">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/30 mx-auto mb-4">
                <Globe className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No websites added</h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                Add your first website to track compliance, security, and accessibility posture.
              </p>
              <Button onClick={() => setOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Website
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
