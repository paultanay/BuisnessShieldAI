import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useListApiKeys, useCreateApiKey, useRevokeApiKey } from "@business-shield/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListApiKeysQueryKey } from "@business-shield/api-client-react";
import { Key, Plus, Copy, Trash2, CheckCircle2, AlertTriangle, Code2, Terminal, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const CODE_SAMPLES = [
  {
    lang: "cURL",
    code: `curl -X POST https://YOUR_DOMAIN/api/websites/123/scans \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
  },
  {
    lang: "JavaScript",
    code: `const response = await fetch('https://YOUR_DOMAIN/api/websites/123/scans', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
});
const scan = await response.json();`,
  },
  {
    lang: "Python",
    code: `import requests

response = requests.post(
    'https://YOUR_DOMAIN/api/websites/123/scans',
    headers={'Authorization': 'Bearer YOUR_API_KEY'}
)
scan = response.json()`,
  },
];

export function DeveloperPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeSample, setActiveSample] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: apiKeys = [], isLoading } = useListApiKeys();
  const createKey = useCreateApiKey();
  const revokeKey = useRevokeApiKey();

  async function handleCreate() {
    if (!newKeyName.trim()) return;
    const result = await createKey.mutateAsync({ data: { name: newKeyName } });
    setNewKeyValue((result as any).key || null);
    queryClient.invalidateQueries({ queryKey: getListApiKeysQueryKey() });
    setNewKeyName("");
  }

  async function handleRevoke(id: number) {
    await revokeKey.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getListApiKeysQueryKey() });
    toast({ title: "API key revoked", description: "The key has been permanently revoked." });
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "API key copied to clipboard." });
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8">
        <PageHeader
          title="Developer Portal"
          description="Manage API keys and integrate BusinessShield into your workflows"
          actions={
            <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) setNewKeyValue(null); }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create API Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create API Key</DialogTitle>
                  <DialogDescription>
                    Give your key a descriptive name so you can identify it later.
                  </DialogDescription>
                </DialogHeader>
                {!newKeyValue ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="key-name">Key Name</Label>
                      <Input
                        id="key-name"
                        placeholder="e.g. Production Integration, CI/CD Pipeline"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
                      <Button onClick={handleCreate} disabled={!newKeyName.trim() || createKey.isPending}>
                        {createKey.isPending ? "Creating…" : "Create Key"}
                      </Button>
                    </DialogFooter>
                  </>
                ) : (
                  <div className="space-y-4">
                    <Alert className="border-green-500/30 bg-green-500/10">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <AlertDescription className="text-green-400">
                        API key created successfully. Copy it now — it won't be shown again.
                      </AlertDescription>
                    </Alert>
                    <div className="rounded-lg bg-muted/50 border border-border p-3 font-mono text-xs break-all">
                      {newKeyValue}
                    </div>
                    <Button
                      className="w-full gap-2"
                      onClick={() => copyToClipboard(newKeyValue)}
                    >
                      {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? "Copied!" : "Copy to Clipboard"}
                    </Button>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => { setCreateOpen(false); setNewKeyValue(null); }}>
                        Done
                      </Button>
                    </DialogFooter>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          }
        />

        {/* API Keys */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Key className="h-4 w-4 text-primary" />
              API Keys
            </CardTitle>
            <CardDescription>
              Keys authenticate your API requests. Store them securely and never expose them in client-side code.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 rounded-lg bg-muted/30 animate-pulse" />
                ))}
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50 mx-auto mb-3">
                  <Key className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium mb-1">No API keys yet</p>
                <p className="text-xs text-muted-foreground">Create your first key to start integrating</p>
              </div>
            ) : (
              <div className="space-y-2">
                {apiKeys.map((key, i) => (
                  <motion.div
                    key={key.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between rounded-lg border border-border bg-card/50 px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-primary/10">
                        <Key className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{key.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{key.keyPrefix}••••••••</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      {key.lastUsedAt ? (
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          Last used {formatDate(key.lastUsedAt)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground hidden sm:block">Never used</span>
                      )}
                      <Badge variant={key.isActive ? "default" : "secondary"} className="text-xs">
                        {key.isActive ? "Active" : "Revoked"}
                      </Badge>
                      <p className="text-xs text-muted-foreground hidden md:block">
                        Created {formatDate(key.createdAt)}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRevoke(key.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Code samples */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Terminal className="h-4 w-4 text-primary" />
              Quick Start
            </CardTitle>
            <CardDescription>Integrate BusinessShield in minutes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              {CODE_SAMPLES.map((s, i) => (
                <Button
                  key={s.lang}
                  variant={activeSample === i ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveSample(i)}
                  className="text-xs"
                >
                  {s.lang}
                </Button>
              ))}
            </div>
            <div className="relative rounded-xl bg-muted/40 border border-border overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
              </div>
              <pre className="p-4 text-xs font-mono text-foreground/80 overflow-x-auto leading-relaxed">
                <code>{CODE_SAMPLES[activeSample].code}</code>
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Resources */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href="/api/healthz"
            target="_blank"
            rel="noreferrer"
            className="flex items-start gap-3 rounded-xl border border-border bg-card/50 p-4 hover:border-primary/30 hover:bg-card transition-colors"
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">API Health Check</p>
              <p className="text-xs text-muted-foreground">Verify your API server is reachable</p>
            </div>
          </a>
          <div className="flex items-start gap-3 rounded-xl border border-border bg-card/50 p-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Code2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Full API Spec</p>
              <p className="text-xs text-muted-foreground">See <code className="text-foreground/80">packages/api-spec/openapi.yaml</code> in the source repository</p>
            </div>
          </div>
        </div>

        <Alert className="border-amber-500/20 bg-amber-500/5">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-400/80 text-sm">
            <strong className="text-amber-400">Security tip:</strong> Never expose API keys in client-side code or version control. Use environment variables or a secrets manager. Pass keys as <code className="text-foreground/90">Authorization: Bearer YOUR_API_KEY</code> — they authenticate as your account for any endpoint under <code className="text-foreground/90">/api</code>.
          </AlertDescription>
        </Alert>
      </div>
    </AppLayout>
  );
}
