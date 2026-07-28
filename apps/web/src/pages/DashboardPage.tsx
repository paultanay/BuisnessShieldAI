import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { ScoreRing } from "@/components/shared/ScoreRing";
import { SeverityBadge, StatusBadge } from "@/components/shared/SeverityBadge";
import {
  useGetDashboardSummary,
  useGetDashboardActivity,
  useGetRiskBreakdown,
  useGetComplianceTrend
} from "@business-shield/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, Globe, AlertTriangle, CheckCircle, Activity as ActivityIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export function DashboardPage() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: activity, isLoading: loadingActivity } = useGetDashboardActivity({ limit: 5 });
  const { data: breakdown, isLoading: loadingBreakdown } = useGetRiskBreakdown();
  const { data: trend, isLoading: loadingTrend } = useGetComplianceTrend();

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        <PageHeader
          title="Dashboard"
          description="Overview of your website portfolio's health and compliance."
        >
          <Link href="/websites">
            <Button>Add Website</Button>
          </Link>
        </PageHeader>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overall Compliance</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    {loadingSummary ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <span className="text-3xl font-bold tracking-tighter">
                        {summary?.avgComplianceScore ? Math.round(summary.avgComplianceScore) : '--'}
                      </span>
                    )}
                    <span className="text-sm text-muted-foreground">/100</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Websites</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    {loadingSummary ? (
                      <Skeleton className="h-8 w-12" />
                    ) : (
                      <span className="text-3xl font-bold tracking-tighter">{summary?.activeWebsites || 0}</span>
                    )}
                    <span className="text-sm text-muted-foreground">/ {summary?.totalWebsites || 0}</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Globe className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Critical Issues</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    {loadingSummary ? (
                      <Skeleton className="h-8 w-12" />
                    ) : (
                      <span className="text-3xl font-bold tracking-tighter">{summary?.criticalIssues || 0}</span>
                    )}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Unread Alerts</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    {loadingSummary ? (
                      <Skeleton className="h-8 w-12" />
                    ) : (
                      <span className="text-3xl font-bold tracking-tighter">{summary?.unreadAlerts || 0}</span>
                    )}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <ActivityIcon className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Compliance Trend</CardTitle>
              <CardDescription>Average portfolio score over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                {loadingTrend ? (
                  <Skeleton className="h-full w-full" />
                ) : trend && trend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                      <YAxis tickLine={false} axisLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Area type="monotone" dataKey="complianceScore" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorCompliance)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No trend data available.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Risk Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Breakdown</CardTitle>
              <CardDescription>Issues by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {loadingBreakdown ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                  ))
                ) : breakdown && breakdown.length > 0 ? (
                  breakdown.map((item) => (
                    <div key={item.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-sm font-medium capitalize">{item.category}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{item.issueCount} issues</span>
                        <span className={`text-sm font-medium ${item.score > 80 ? 'text-emerald-500' : item.score > 50 ? 'text-yellow-500' : 'text-destructive'}`}>
                          {item.score}/100
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">No risk data available.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {loadingActivity ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </div>
                ))
              ) : activity && activity.length > 0 ? (
                activity.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex flex-shrink-0 items-center justify-center">
                      <ActivityIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(item.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">No recent activity.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
