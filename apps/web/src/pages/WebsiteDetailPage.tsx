import { useParams, Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useGetWebsite,
  getGetWebsiteQueryKey,
  useListScans,
  useGetMonitoringConfig,
  useTriggerScan,
  getListScansQueryKey
} from "@business-shield/api-client-react";
import { ScoreRing } from "@/components/shared/ScoreRing";
import { StatusBadge } from "@/components/shared/SeverityBadge";
import { Play, Calendar, Settings, Activity, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export function WebsiteDetailPage() {
  const { id } = useParams();
  const websiteId = parseInt(id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: website, isLoading: loadingWebsite } = useGetWebsite(websiteId, {
    query: { enabled: !!websiteId, queryKey: getGetWebsiteQueryKey(websiteId) }
  });

  const { data: scans, isLoading: loadingScans } = useListScans(websiteId, {
    query: { enabled: !!websiteId, queryKey: ["listScans", websiteId] } // simplified query key fallback
  });

  const { data: monitoring, isLoading: loadingMonitoring } = useGetMonitoringConfig(websiteId, {
    query: { enabled: !!websiteId, queryKey: ["getMonitoringConfig", websiteId] }
  });

  const triggerScanMutation = useTriggerScan({
    mutation: {
      onSuccess: () => {
        toast({ title: "Scan started", description: "The scan is now queued." });
        queryClient.invalidateQueries({ queryKey: ["listScans", websiteId] });
        queryClient.invalidateQueries({ queryKey: getGetWebsiteQueryKey(websiteId) });
      },
      onError: (err: any) => {
        toast({ title: "Failed to start scan", description: err.message, variant: "destructive" });
      }
    }
  });

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        <PageHeader
          title={loadingWebsite ? "Loading..." : website?.name || "Website Details"}
          description={website?.url}
        >
          <div className="flex items-center gap-3">
            {website && <StatusBadge status={website.status} />}
            <Button
              onClick={() => triggerScanMutation.mutate({ id: websiteId, data: { scanTypes: ["full"] } })}
              disabled={triggerScanMutation.isPending || website?.status === "paused"}
            >
              <Play className="mr-2 h-4 w-4" />
              {triggerScanMutation.isPending ? "Starting..." : "Run New Scan"}
            </Button>
          </div>
        </PageHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Compliance Score</p>
                {loadingWebsite ? <Skeleton className="h-8 w-16" /> : (
                  <span className={`text-3xl font-bold ${website?.complianceScore && website.complianceScore > 80 ? 'text-emerald-500' : 'text-yellow-500'}`}>
                    {website?.complianceScore ? Math.round(website.complianceScore) : '--'}
                  </span>
                )}
              </div>
              <ScoreRing score={website?.complianceScore} size={64} strokeWidth={6} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Risk Score</p>
                {loadingWebsite ? <Skeleton className="h-8 w-16" /> : (
                  <span className={`text-3xl font-bold ${website?.riskScore && website.riskScore < 20 ? 'text-emerald-500' : 'text-destructive'}`}>
                    {website?.riskScore ? Math.round(website.riskScore) : '--'}
                  </span>
                )}
              </div>
              <ScoreRing score={website?.riskScore} size={64} strokeWidth={6} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Monitoring</p>
              </div>
              {loadingMonitoring ? <Skeleton className="h-6 w-full mt-2" /> : (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={monitoring?.enabled ? "active" : "paused"} />
                    <span className="text-sm capitalize">{monitoring?.frequency || 'manual'} frequency</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Last Scanned</p>
              </div>
              {loadingWebsite ? <Skeleton className="h-6 w-3/4 mt-2" /> : (
                <p className="text-lg font-medium mt-2">
                  {website?.lastScannedAt ? new Date(website.lastScannedAt).toLocaleDateString() : 'Never'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Scan History</h2>
          </div>

          <Card>
            <div className="divide-y divide-border">
              {loadingScans ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-6 flex items-center justify-between">
                    <div className="space-y-2 w-1/3">
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))
              ) : scans && scans.length > 0 ? (
                scans.map((scan) => (
                  <div key={scan.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <StatusBadge status={scan.status} />
                        <span className="text-sm font-medium">
                          {new Date(scan.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {scan.summary || `${scan.findingsCount || 0} findings detected`}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {scan.scanTypes.map(type => (
                          <Badge key={type} variant="secondary" className="text-xs capitalize">{type}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:ml-auto">
                      {scan.status === "completed" && (
                        <div className="flex gap-4 text-center mr-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Compliance</p>
                            <p className="font-semibold">{Math.round(scan.complianceScore || 0)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Risk</p>
                            <p className="font-semibold text-destructive">{Math.round(scan.riskScore || 0)}</p>
                          </div>
                        </div>
                      )}

                      <Link href={`/websites/${websiteId}/scans/${scan.id}`}>
                        <Button variant="outline" size="sm">
                          View Results
                          <ExternalLink className="ml-2 h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  No scans have been run for this website yet.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
