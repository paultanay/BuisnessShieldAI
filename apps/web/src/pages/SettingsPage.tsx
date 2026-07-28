import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  User, Bell, Shield, Palette, Key, LogOut, Trash2,
  CheckCircle2, Mail, Lock, Moon, Monitor, ExternalLink,
  AlertTriangle, Globe, Zap,
} from "lucide-react";
import { motion } from "framer-motion";

const SECTIONS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "security", label: "Security", icon: Shield },
  { id: "danger", label: "Danger Zone", icon: Trash2 },
];

export function SettingsPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { toast } = useToast();
  const [active, setActive] = useState("profile");

  const [displayName, setDisplayName] = useState(user?.fullName || "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [notifs, setNotifs] = useState({
    scanComplete: true,
    criticalFindings: true,
    weeklyDigest: true,
    sslExpiry: true,
    teamActivity: false,
    marketingEmails: false,
  });

  async function handleSaveProfile() {
    if (!user) return;
    setSavingProfile(true);
    try {
      const [firstName, ...rest] = displayName.trim().split(" ");
      await user.update({ firstName, lastName: rest.join(" ") || undefined });
      toast({ title: "Profile updated" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  }

  function handleNotifToggle(key: keyof typeof notifs) {
    setNotifs((prev) => ({ ...prev, [key]: !prev[key] }));
    toast({ title: "Preference saved" });
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <PageHeader title="Settings" description="Account, notifications, and security." />

        <div className="flex gap-8 mt-2">
          {/* Left nav */}
          <nav className="hidden md:flex flex-col w-52 flex-shrink-0 gap-1">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left ${
                  active === s.id
                    ? "bg-primary/10 text-primary"
                    : s.id === "danger"
                    ? "text-destructive/70 hover:text-destructive hover:bg-destructive/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <s.icon className="h-4 w-4" />
                {s.label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Profile */}
            {active === "profile" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      Profile
                    </CardTitle>
                    <CardDescription>Your personal details as they appear across the platform</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                        {(user?.fullName || user?.primaryEmailAddress?.emailAddress || "U")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{user?.fullName || "—"}</p>
                        <p className="text-sm text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
                        <Badge variant="outline" className="mt-1 text-xs text-green-400 border-green-400/30">
                          <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> Verified
                        </Badge>
                      </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Full Name</Label>
                        <Input
                          id="displayName"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Your full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            id="email"
                            value={user?.primaryEmailAddress?.emailAddress || ""}
                            disabled
                            className="pl-9 bg-muted/30"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Managed via your identity provider</p>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleSaveProfile} disabled={savingProfile}>
                        {savingProfile ? "Saving…" : "Save Changes"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" />
                      Workspace
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-0">
                    {[
                      { label: "Deployment", value: "Self-hosted", action: <Link href="/billing"><Button size="sm" variant="outline">View Usage</Button></Link> },
                      { label: "Member since", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—", action: null },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                        <span className="text-sm text-muted-foreground">{row.label}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">{row.value}</span>
                          {row.action}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Notifications */}
            {active === "notifications" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Bell className="h-4 w-4 text-primary" />
                      Email Notifications
                    </CardTitle>
                    <CardDescription>Choose which events trigger an email notification</CardDescription>
                  </CardHeader>
                  <CardContent className="divide-y divide-border">
                    {[
                      { key: "scanComplete", label: "Scan completed", desc: "Notified when any monitored website scan finishes" },
                      { key: "criticalFindings", label: "Critical findings detected", desc: "Immediate notification when critical severity issues are identified" },
                      { key: "sslExpiry", label: "SSL certificate expiry", desc: "Warning at 30, 14, and 7 days before a certificate expires" },
                      { key: "weeklyDigest", label: "Weekly portfolio digest", desc: "Monday summary: compliance posture across all monitored sites" },
                      { key: "teamActivity", label: "Team activity", desc: "When team members join, are removed, or change roles" },
                      { key: "marketingEmails", label: "Product updates", desc: "Release notes, new features, and security advisories" },
                    ].map((n) => (
                      <div key={n.key} className="flex items-center justify-between py-4">
                        <div>
                          <p className="text-sm font-medium">{n.label}</p>
                          <p className="text-xs text-muted-foreground">{n.desc}</p>
                        </div>
                        <Switch
                          checked={notifs[n.key as keyof typeof notifs]}
                          onCheckedChange={() => handleNotifToggle(n.key as keyof typeof notifs)}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Appearance */}
            {active === "appearance" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Palette className="h-4 w-4 text-primary" />
                      Appearance
                    </CardTitle>
                    <CardDescription>Interface theme and accent preferences</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Color Theme</Label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { name: "Dark", icon: Moon, active: true },
                          { name: "System", icon: Monitor, active: false },
                          { name: "Light", icon: Zap, active: false },
                        ].map((t) => (
                          <button
                            key={t.name}
                            className={`rounded-xl border-2 p-4 text-center transition-colors ${t.active ? "border-primary bg-primary/5" : "border-border hover:border-border/80"}`}
                          >
                            <t.icon className={`h-5 w-5 mx-auto mb-2 ${t.active ? "text-primary" : "text-muted-foreground"}`} />
                            <p className={`text-xs font-medium ${t.active ? "text-primary" : "text-muted-foreground"}`}>{t.name}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Accent Color</Label>
                      <div className="flex gap-3">
                        {["bg-indigo-500", "bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-rose-500"].map((c) => (
                          <button key={c} className={`h-8 w-8 rounded-full ${c} ring-2 ${c === "bg-indigo-500" ? "ring-white ring-offset-2 ring-offset-background" : "ring-transparent"}`} />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Security */}
            {active === "security" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary" />
                      Account Security
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="divide-y divide-border">
                    {[
                      { label: "Password", value: "Managed via identity provider", action: null },
                      { label: "Two-Factor Authentication", value: "Configure via your identity provider", action: null },
                      { label: "Active Sessions", value: "1 active session", action: <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => signOut()}>Sign out</Button> },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between py-4">
                        <div>
                          <p className="text-sm font-medium">{row.label}</p>
                          <p className="text-xs text-muted-foreground">{row.value}</p>
                        </div>
                        {row.action}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Key className="h-4 w-4 text-primary" />
                      API Keys
                    </CardTitle>
                    <CardDescription>Manage programmatic access credentials</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/developer">
                      <Button variant="outline" className="gap-2">
                        <Key className="h-4 w-4" />
                        Manage API Keys
                        <ExternalLink className="h-3 w-3 ml-1 text-muted-foreground" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      Audit Log
                    </CardTitle>
                    <CardDescription>Full history of all actions performed in this account</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/audit-logs">
                      <Button variant="outline" className="gap-2">
                        View Audit Log
                        <ExternalLink className="h-3 w-3 ml-1 text-muted-foreground" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Danger Zone */}
            {active === "danger" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <Alert className="border-destructive/30 bg-destructive/5">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive/80">
                    Actions in this section are permanent and cannot be undone.
                  </AlertDescription>
                </Alert>
                <Card className="border-destructive/20">
                  <CardContent className="pt-6 divide-y divide-border">
                    {[
                      {
                        label: "Export Data",
                        desc: "Download all scan data, reports, and settings as a JSON archive",
                        action: "Export",
                        variant: "outline" as const,
                        onClick: undefined,
                      },
                      {
                        label: "Sign Out Everywhere",
                        desc: "Revoke all active sessions across all devices",
                        action: "Sign Out All",
                        variant: "outline" as const,
                        onClick: () => signOut(),
                      },
                      {
                        label: "Delete Account",
                        desc: "Permanently delete your account and all associated data. This cannot be undone.",
                        action: "Delete Account",
                        variant: "destructive" as const,
                        onClick: undefined,
                      },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between py-4">
                        <div>
                          <p className="text-sm font-medium">{row.label}</p>
                          <p className="text-xs text-muted-foreground max-w-sm">{row.desc}</p>
                        </div>
                        <Button size="sm" variant={row.variant} onClick={row.onClick}>
                          {row.action}
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
