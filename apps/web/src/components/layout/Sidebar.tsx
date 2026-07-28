import { Link, useLocation } from "wouter";
import { Shield, LayoutDashboard, Globe, Activity, FileText, FileSignature, Bell, Users, Settings, Menu, Key, ClipboardList, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useListAlerts } from "@business-shield/api-client-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "main" },
  { name: "Websites", href: "/websites", icon: Globe, group: "main" },
  { name: "Monitoring", href: "/monitoring", icon: Activity, group: "main" },
  { name: "Reports", href: "/reports", icon: FileText, group: "main" },
  { name: "Policies", href: "/policies", icon: FileSignature, group: "main" },
  { name: "Alerts", href: "/alerts", icon: Bell, group: "main" },
  { name: "Team", href: "/team", icon: Users, group: "tools" },
  { name: "Developer", href: "/developer", icon: Key, group: "tools" },
  { name: "Audit Logs", href: "/audit-logs", icon: ClipboardList, group: "tools" },
  { name: "Usage & Platform", href: "/billing", icon: GitBranch, group: "settings" },
  { name: "Settings", href: "/settings", icon: Settings, group: "settings" },
];

export function Sidebar({ className }: { className?: string }) {
  const [location] = useLocation();
  const { data: alerts } = useListAlerts();
  const unreadCount = alerts?.filter(a => !a.isRead).length || 0;

  return (
    <div className={`flex h-full flex-col bg-sidebar border-r border-sidebar-border ${className || ""}`}>
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Shield className="h-5 w-5" />
          </div>
          <span className="font-semibold text-sidebar-foreground">BusinessShield</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-0.5">
        {(() => {
          const groups = [
            { key: "main", label: null },
            { key: "tools", label: "Tools" },
            { key: "settings", label: "Account" },
          ];
          return groups.map(({ key, label }) => {
            const items = navigation.filter((n) => n.group === key);
            return (
              <div key={key} className={label ? "pt-3" : ""}>
                {label && (
                  <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/30">
                    {label}
                  </p>
                )}
                {items.map((item) => {
                  const isActive = location.startsWith(item.href) && (item.href !== "/dashboard" || location === "/dashboard");
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon
                          className={`h-4 w-4 flex-shrink-0 ${
                            isActive
                              ? "text-primary"
                              : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70"
                          }`}
                          aria-hidden="true"
                        />
                        {item.name}
                      </div>
                      <div className="flex items-center gap-1">
                        {(item as any).badge && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400 leading-none">
                            {(item as any).badge}
                          </span>
                        )}
                        {item.name === "Alerts" && unreadCount > 0 && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            );
          });
        })()}
      </nav>

      <div className="p-4 mt-auto border-t border-sidebar-border">
        <div className="rounded-lg bg-sidebar-accent/50 p-3 border border-sidebar-border">
          <div className="flex items-center gap-2">
            <GitBranch className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
            <p className="text-xs font-medium text-sidebar-foreground">Open Source · MIT</p>
          </div>
          <p className="text-[10px] text-sidebar-foreground/60 mt-1">Self-hosted, all features included</p>
        </div>
      </div>
    </div>
  );
}

export function MobileSidebar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open sidebar</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64 border-r-0 bg-sidebar">
        <Sidebar />
      </SheetContent>
    </Sheet>
  );
}
