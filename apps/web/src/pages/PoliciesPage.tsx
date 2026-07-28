import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { useListPolicies, useGeneratePolicy, useListWebsites, getListPoliciesQueryKey } from "@business-shield/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { FileSignature, Copy, FileText, Plus, CheckCircle2, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const POLICY_TYPES = [
  { value: "privacy_policy", label: "Privacy Policy", desc: "Data collection disclosure draft for review" },
  { value: "cookie_policy", label: "Cookie Policy", desc: "Cookie categories, consent, and opt-out instructions" },
  { value: "accessibility_statement", label: "Accessibility Statement", desc: "Accessibility status and accommodation contact" },
  { value: "terms_of_service", label: "Terms of Service", desc: "User agreement, liability, and intellectual property" },
];

const POLICY_ICONS: Record<string, typeof FileText> = {
  privacy_policy: FileSignature,
  cookie_policy: FileText,
  accessibility_statement: CheckCircle2,
  terms_of_service: FileText,
};

function PolicyIcon({ type, className }: { type: string; className?: string }) {
  const Icon = POLICY_ICONS[type] ?? FileText;
  return <Icon className={className} />;
}

export function PoliciesPage() {
  const { data: policies, isLoading } = useListPolicies();
  const { data: websites = [] } = useListWebsites();
  const [generateOpen, setGenerateOpen] = useState(false);
  const [policyType, setPolicyType] = useState("privacy_policy");
  const [websiteId, setWebsiteId] = useState<string>("");
  const [companyName, setCompanyName] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const generatePolicy = useGeneratePolicy({
    mutation: {
      onSuccess: () => {
        toast({ title: "Policy draft generated", description: "Review the draft before publishing it." });
        queryClient.invalidateQueries({ queryKey: getListPoliciesQueryKey() });
        setGenerateOpen(false);
        resetForm();
      },
      onError: (err: any) => {
        toast({ title: "Generation failed", description: err.message, variant: "destructive" });
      },
    },
  });

  function resetForm() {
    setPolicyType("privacy_policy");
    setWebsiteId("");
    setCompanyName("");
  }

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    const site = websites.find((w) => String(w.id) === websiteId);
    if (!site) {
      toast({
        title: "Select a website",
        description: "Choose a website before generating a policy draft.",
        variant: "destructive",
      });
      return;
    }

    generatePolicy.mutate({
      data: {
        type: policyType as any,
        websiteId: site.id,
        websiteUrl: site.url,
        companyName: companyName || site.name,
      },
    });
  }

  function copyContent(policy: any) {
    navigator.clipboard.writeText(policy.content || "");
    setCopiedId(policy.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Copied!", description: "Policy HTML copied to clipboard." });
  }

  function exportPolicy(policy: any) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${policy.title}</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.7; color: #1a1a1a; }
  h1 { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.5rem; }
  .meta { color: #666; font-size: 0.875rem; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #eee; }
  pre { white-space: pre-wrap; font-family: inherit; font-size: 0.9rem; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
<h1>${policy.title}</h1>
<div class="meta">
  ${policy.companyName ? `Company: ${policy.companyName} &nbsp;-&nbsp; ` : ""}Generated: ${new Date(policy.createdAt).toLocaleDateString()}
</div>
<pre>${(policy.content || "").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(policy.title || "policy").replace(/\s+/g, "-").toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: "Open the file in a browser, then print and save as PDF." });
  }

  const policyTypeLabels: Record<string, string> = Object.fromEntries(
    POLICY_TYPES.map((p) => [p.value, p.label])
  );

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        <PageHeader
          title="Policy Generator"
          description="Structured policy drafts based on your saved website profile."
          actions={
            <Button onClick={() => setGenerateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Generate Policy
            </Button>
          }
        />

        {/* Generate dialog */}
        <Dialog open={generateOpen} onOpenChange={(o) => { setGenerateOpen(o); if (!o) resetForm(); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <FileSignature className="h-5 w-5 text-primary" />
                <DialogTitle>Generate New Policy</DialogTitle>
              </div>
              <DialogDescription>
                Generate a structured draft that should be reviewed before publication.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleGenerate} className="space-y-5 py-2">
              <div className="space-y-2">
                <Label>Policy Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {POLICY_TYPES.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPolicyType(p.value)}
                      className={`text-left rounded-xl border p-3 transition-colors ${
                        policyType === p.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-border/80"
                      }`}
                    >
                      <PolicyIcon type={p.value} className="h-5 w-5 text-primary mb-2" />
                      <p className="text-xs font-semibold">{p.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Website</Label>
                <Select value={websiteId} onValueChange={setWebsiteId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a website..." />
                  </SelectTrigger>
                  <SelectContent>
                    {websites.map((w) => (
                      <SelectItem key={w.id} value={String(w.id)}>
                          {w.name} - {w.url}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company / Organization Name</Label>
                <Input
                  id="company"
                  placeholder="Acme Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setGenerateOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={!websiteId || generatePolicy.isPending} className="gap-2">
                  {generatePolicy.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                  ) : (
                    <><FileSignature className="h-4 w-4" /> Generate</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 gap-6">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-1/4" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))
          ) : policies && policies.length > 0 ? (
            policies.map((policy, i) => (
              <motion.div
                key={policy.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <Card className="overflow-hidden hover:border-primary/20 transition-colors">
                  <CardContent className="p-0 flex flex-col md:flex-row">
                    {/* Sidebar */}
                    <div className="p-6 bg-muted/20 border-r border-border md:w-72 flex-shrink-0 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <PolicyIcon type={policy.type} className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold leading-tight">{policy.title}</h3>
                          <Badge variant="outline" className="mt-1.5 text-xs">
                            {policyTypeLabels[policy.type] || policy.type}
                          </Badge>
                        </div>
                      </div>

                      <div className="text-sm space-y-2 text-muted-foreground pt-3 border-t border-border">
                        {policy.companyName && (
                          <p><span className="font-medium text-foreground">Company:</span> {policy.companyName}</p>
                        )}
                        {policy.websiteUrl && (
                          <p className="truncate"><span className="font-medium text-foreground">Site:</span> {policy.websiteUrl}</p>
                        )}
                        <p><span className="font-medium text-foreground">Generated:</span> {new Date(policy.createdAt).toLocaleDateString()}</p>
                      </div>

                      <div className="pt-3 flex gap-2 flex-col">
                        <Button
                          variant="outline"
                          className="w-full text-xs h-9 gap-2"
                          onClick={() => copyContent(policy)}
                        >
                          {copiedId === policy.id ? (
                            <><CheckCircle2 className="h-3.5 w-3.5 text-green-400" /> Copied!</>
                          ) : (
                            <><Copy className="h-3.5 w-3.5" /> Copy Text</>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full text-xs h-9 gap-2"
                          onClick={() => exportPolicy(policy)}
                        >
                          <Download className="h-3.5 w-3.5" /> Export HTML
                        </Button>
                      </div>
                    </div>

                    {/* Content preview */}
                    <div className="flex-1 h-72 overflow-y-auto p-6 bg-background/50">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed font-mono">
                          {policy.content || "Content preview not available."}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card/30">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/30 mx-auto mb-4">
                <FileSignature className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No policies generated yet</h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                Generate structured Privacy Policies, Cookie Policies, and Terms of Service drafts for review.
              </p>
              <Button onClick={() => setGenerateOpen(true)} className="gap-2">
                <FileSignature className="h-4 w-4" />
                Generate Your First Policy
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
