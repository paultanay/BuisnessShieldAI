import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { useListAlerts, useMarkAllAlertsRead } from "@business-shield/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { Bell, Check, AlertTriangle, Shield, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

export function AlertsPage() {
  const { data: alerts, isLoading } = useListAlerts();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [markingId, setMarkingId] = useState<number | null>(null);

  async function handleMarkRead(alertId: number) {
    setMarkingId(alertId);
    try {
      const res = await fetch(`${BASE_URL}/api/alerts/${alertId}/read`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to mark as read");
      queryClient.invalidateQueries({ queryKey: ["listAlerts"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setMarkingId(null);
    }
  }

  const markAllRead = useMarkAllAlertsRead({
    mutation: {
      onSuccess: () => {
        toast({ title: "All caught up", description: "All alerts marked as read." });
        queryClient.invalidateQueries({ queryKey: ["listAlerts"] });
      }
    }
  });

  const getIcon = (type: string) => {
    if (type.includes("security") || type.includes("drift")) return <Shield className="h-4 w-4" />;
    if (type.includes("expiry") || type.includes("downtime")) return <Clock className="h-4 w-4" />;
    return <Bell className="h-4 w-4" />;
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
        <PageHeader
          title="Alert Center"
          description="Security and compliance notifications across your portfolio."
        >
          <Button
            variant="outline"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending || !alerts?.some(a => !a.isRead)}
          >
            <Check className="mr-2 h-4 w-4" />
            Mark All Read
          </Button>
        </PageHeader>

        <Card>
          <div className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 flex gap-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))
            ) : alerts && alerts.length > 0 ? (
              alerts.map((alert) => (
                <div key={alert.id} className={`p-4 flex gap-4 transition-colors hover:bg-muted/30 ${!alert.isRead ? 'bg-primary/5' : ''}`}>
                  <div className={`mt-1 h-8 w-8 rounded-full flex flex-shrink-0 items-center justify-center
                    ${alert.severity === 'critical' ? 'bg-destructive/10 text-destructive' :
                      alert.severity === 'high' ? 'bg-orange-500/10 text-orange-500' :
                      'bg-muted text-muted-foreground'}`}>
                    {getIcon(alert.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`text-sm font-semibold ${!alert.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {alert.title}
                      </h4>
                      <SeverityBadge severity={alert.severity} size="sm" />
                    </div>
                    <p className={`text-sm mt-1 ${!alert.isRead ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
                      {alert.message}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-2">
                      {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!alert.isRead && (
                    <div className="flex flex-col items-center gap-1.5 flex-shrink-0 ml-1">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-[10px] h-6 px-2 text-muted-foreground hover:text-foreground"
                        disabled={markingId === alert.id}
                        onClick={() => handleMarkRead(alert.id)}
                      >
                        {markingId === alert.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Mark read"}
                      </Button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="mx-auto h-10 w-10 opacity-20 mb-3" />
                <p>No alerts at this time.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
