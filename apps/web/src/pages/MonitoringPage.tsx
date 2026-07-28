import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { useListWebsites, useUpsertMonitoringConfig, getGetMonitoringConfigQueryKey } from "@business-shield/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export function MonitoringPage() {
  const { data: websites, isLoading } = useListWebsites();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateConfig = useUpsertMonitoringConfig({
    mutation: {
      onSuccess: (data, variables) => {
        toast({ title: "Monitoring Updated", description: "Your changes have been saved." });
        queryClient.invalidateQueries({ queryKey: getGetMonitoringConfigQueryKey(variables.id) });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    }
  });

  const handleToggle = (id: number, current: boolean) => {
    updateConfig.mutate({
      id,
      data: { enabled: !current }
    });
  };

  const handleFrequency = (id: number, frequency: "hourly" | "daily" | "weekly") => {
    updateConfig.mutate({
      id,
      data: { frequency }
    });
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        <PageHeader
          title="Active Monitoring"
          description="Configure continuous scanning and alert rules for your websites."
        />

        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))
          ) : websites && websites.length > 0 ? (
            websites.map((site) => (
              <Card key={site.id}>
                <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{site.name}</h3>
                      <p className="text-sm text-muted-foreground">{site.url}</p>

                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`monitor-${site.id}`}
                            checked={site.monitoringEnabled}
                            onCheckedChange={() => handleToggle(site.id, !!site.monitoringEnabled)}
                            disabled={updateConfig.isPending}
                          />
                          <Label htmlFor={`monitor-${site.id}`} className="text-sm font-medium">
                            {site.monitoringEnabled ? "Monitoring Active" : "Monitoring Paused"}
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0">
                    <div className="space-y-1.5 w-full sm:w-auto">
                      <Label className="text-xs text-muted-foreground">Scan Frequency</Label>
                      <Select
                        defaultValue={site.scanFrequency || "weekly"}
                        disabled={!site.monitoringEnabled || updateConfig.isPending}
                        onValueChange={(val: any) => handleFrequency(site.id, val)}
                      >
                        <SelectTrigger className="w-full sm:w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <a href="/alerts" className="w-full sm:w-auto mt-5">
                      <Button variant="outline" className="w-full">Configure Alerts</Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 border rounded-xl bg-card">
              <ShieldAlert className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">No websites found</h3>
              <p className="text-muted-foreground">Add a website first to configure monitoring.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
