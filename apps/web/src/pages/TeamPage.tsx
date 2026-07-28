import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  useListTeamMembers, useInviteTeamMember, useRemoveTeamMember,
  getListTeamMembersQueryKey,
} from "@business-shield/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Loader2, Crown, Eye, Pencil, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const ROLE_META = {
  admin: { icon: Crown, color: "text-amber-400", bg: "bg-amber-400/10", label: "Admin", desc: "Full access to all features" },
  member: { icon: Pencil, color: "text-blue-400", bg: "bg-blue-400/10", label: "Member", desc: "Can scan and view reports" },
  viewer: { icon: Eye, color: "text-muted-foreground", bg: "bg-muted/50", label: "Viewer", desc: "Read-only access" },
};

export function TeamPage() {
  const { data: members, isLoading } = useListTeamMembers();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{ id: number; email: string } | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member" | "viewer">("member");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const inviteMember = useInviteTeamMember({
    mutation: {
      onSuccess: () => {
        toast({ title: "Invitation sent", description: `Invited ${email} to your workspace.` });
        queryClient.invalidateQueries({ queryKey: getListTeamMembersQueryKey() });
        setInviteOpen(false);
        setEmail("");
        setRole("member");
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      },
    },
  });

  const removeMember = useRemoveTeamMember({
    mutation: {
      onSuccess: () => {
        toast({ title: "Member removed", description: `${removeTarget?.email} has been removed from the workspace.` });
        queryClient.invalidateQueries({ queryKey: getListTeamMembersQueryKey() });
        setRemoveTarget(null);
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      },
    },
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    inviteMember.mutate({ data: { email, role } });
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
        <PageHeader
          title="Team Management"
          description="Manage who has access to your workspace and what they can do."
          actions={
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Users className="h-4 w-4" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>Send an invitation email to join this workspace.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleInvite} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={role} onValueChange={(v: any) => setRole(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLE_META).map(([key, meta]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex flex-col">
                              <span>{meta.label}</span>
                              <span className="text-xs text-muted-foreground">{meta.desc}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={inviteMember.isPending}>
                      {inviteMember.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Send Invite
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          }
        />

        {/* Role overview */}
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(ROLE_META).map(([key, meta]) => (
            <div key={key} className={`rounded-xl border border-border p-4 ${meta.bg}`}>
              <div className="flex items-center gap-2 mb-1">
                <meta.icon className={`h-4 w-4 ${meta.color}`} />
                <span className={`text-sm font-semibold ${meta.color}`}>{meta.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">{meta.desc}</p>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" />
              Members
            </CardTitle>
            <CardDescription>
              {members ? `${members.length} member${members.length !== 1 ? "s" : ""}` : "People with access to this workspace"}
            </CardDescription>
          </CardHeader>
          <div className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))
            ) : members && members.length > 0 ? (
              members.map((member, i) => {
                const roleMeta = ROLE_META[member.role as keyof typeof ROLE_META] || ROLE_META.member;
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-5 flex items-center justify-between hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {(member.name || member.email)[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-medium">{member.name || "Pending User"}</h4>
                          {member.status === "invited" && (
                            <Badge variant="secondary" className="text-[10px] h-4">Invited</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${roleMeta.bg} ${roleMeta.color}`}>
                        <roleMeta.icon className="h-3 w-3" />
                        {roleMeta.label}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setRemoveTarget({ id: member.id, email: member.email })}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="p-14 text-center text-muted-foreground">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/30 mx-auto mb-3">
                  <Users className="h-7 w-7 opacity-30" />
                </div>
                <p className="font-medium mb-1">No team members yet</p>
                <p className="text-sm">Invite your team to collaborate on compliance monitoring.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Remove confirmation dialog */}
      <Dialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{removeTarget?.email}</strong> from your workspace?
              They will immediately lose access to all data and scans.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={removeMember.isPending}
              onClick={() => removeTarget && removeMember.mutate({ id: removeTarget.id })}
            >
              {removeMember.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
