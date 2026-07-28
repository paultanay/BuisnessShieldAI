import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCompleteOnboarding } from "@business-shield/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Building2, Globe2, CheckCircle2, ArrowRight, ChevronLeft,
  Heart, CreditCard, ShoppingCart, Code2, Scale, Tv, GraduationCap, Handshake,
  AlertTriangle, Lock, FileCheck, Server, PersonStanding,
} from "lucide-react";
import { useLocation } from "wouter";

const STEPS = ["Identity", "Industry", "Location & Size", "Compliance Focus", "Ready"] as const;

const INDUSTRIES = [
  { value: "healthcare", label: "Healthcare", icon: Heart, color: "text-red-400", bg: "bg-red-400/10 border-red-400/30", desc: "Clinics, hospitals, health tech, telemedicine" },
  { value: "fintech", label: "Fintech", icon: CreditCard, color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/30", desc: "Banking, payments, lending, crypto" },
  { value: "ecommerce", label: "E-commerce", icon: ShoppingCart, color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/30", desc: "Online retail, marketplaces, DTC brands" },
  { value: "saas", label: "SaaS", icon: Code2, color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/30", desc: "B2B software, APIs, developer tools" },
  { value: "legal", label: "Legal", icon: Scale, color: "text-violet-400", bg: "bg-violet-400/10 border-violet-400/30", desc: "Law firms, legaltech, compliance consulting" },
  { value: "media", label: "Media", icon: Tv, color: "text-pink-400", bg: "bg-pink-400/10 border-pink-400/30", desc: "Publishing, streaming, content platforms" },
  { value: "education", label: "Education", icon: GraduationCap, color: "text-cyan-400", bg: "bg-cyan-400/10 border-cyan-400/30", desc: "EdTech, universities, e-learning" },
  { value: "nonprofit", label: "Nonprofit", icon: Handshake, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/30", desc: "Charities, NGOs, foundations" },
  { value: "other", label: "Other", icon: Building2, color: "text-slate-400", bg: "bg-slate-400/10 border-slate-400/30", desc: "Manufacturing, logistics, consulting, etc." },
];

const COUNTRIES = [
  { value: "US", label: "United States", flag: "🇺🇸" },
  { value: "GB", label: "United Kingdom", flag: "🇬🇧" },
  { value: "DE", label: "Germany", flag: "🇩🇪" },
  { value: "FR", label: "France", flag: "🇫🇷" },
  { value: "NL", label: "Netherlands", flag: "🇳🇱" },
  { value: "CA", label: "Canada", flag: "🇨🇦" },
  { value: "AU", label: "Australia", flag: "🇦🇺" },
  { value: "IN", label: "India", flag: "🇮🇳" },
  { value: "SG", label: "Singapore", flag: "🇸🇬" },
  { value: "JP", label: "Japan", flag: "🇯🇵" },
  { value: "BR", label: "Brazil", flag: "🇧🇷" },
  { value: "EU", label: "European Union (other)", flag: "🇪🇺" },
  { value: "OTHER", label: "Other", flag: "🌍" },
];

const TEAM_SIZES = [
  { value: "1-10", label: "1–10", desc: "Solo / Early-stage" },
  { value: "11-50", label: "11–50", desc: "Startup" },
  { value: "51-200", label: "51–200", desc: "Growth-stage" },
  { value: "200+", label: "200+", desc: "Mid-market" },
  { value: "enterprise", label: "Enterprise", desc: "1000+ employees" },
];

const CONCERNS = [
  { value: "gdpr", label: "GDPR", icon: Globe2, color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20", desc: "EU privacy regulation" },
  { value: "ccpa", label: "CCPA", icon: Lock, color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20", desc: "California privacy law" },
  { value: "hipaa", label: "HIPAA", icon: Heart, color: "text-red-400", bg: "bg-red-400/10 border-red-400/20", desc: "US healthcare data" },
  { value: "pci", label: "PCI-DSS", icon: CreditCard, color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/20", desc: "Payment card security" },
  { value: "wcag", label: "WCAG / ADA", icon: PersonStanding, color: "text-violet-400", bg: "bg-violet-400/10 border-violet-400/20", desc: "Web accessibility" },
  { value: "iso27001", label: "ISO 27001", icon: Server, color: "text-cyan-400", bg: "bg-cyan-400/10 border-cyan-400/20", desc: "Info security mgmt" },
  { value: "sox", label: "SOX", icon: FileCheck, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20", desc: "Financial reporting" },
  { value: "soc2", label: "SOC 2", icon: Shield, color: "text-indigo-400", bg: "bg-indigo-400/10 border-indigo-400/20", desc: "Service org controls" },
];

// Auto-suggest concerns based on industry + country
function suggestConcerns(industry: string, country: string): string[] {
  const isEU = ["DE", "FR", "NL", "GB", "EU", "BE", "SE", "DK", "FI", "IE", "PL", "AT", "ES", "IT", "PT"].includes(country);
  const suggestions: string[] = [];
  if (isEU) suggestions.push("gdpr");
  if (country === "US") suggestions.push("ccpa");
  if (industry === "healthcare") suggestions.push("hipaa");
  if (industry === "fintech") suggestions.push("pci", "soc2");
  if (industry === "saas") suggestions.push("soc2");
  if (industry === "education") suggestions.push("wcag");
  if (!suggestions.includes("wcag") && ["saas", "ecommerce"].includes(industry)) suggestions.push("wcag");
  return [...new Set(suggestions)];
}


export function OnboardingPage({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [size, setSize] = useState("");
  const [concerns, setConcerns] = useState<string[]>([]);
  const [, setLocation] = useLocation();

  const completeOnboarding = useCompleteOnboarding();

  const toggleConcern = (v: string) => {
    setConcerns(prev => prev.includes(v) ? prev.filter(c => c !== v) : [...prev, v]);
  };

  const handleCountrySelect = (val: string) => {
    setCountry(val);
    setConcerns(suggestConcerns(industry, val));
  };

  const handleIndustrySelect = (val: string) => {
    setIndustry(val);
    setConcerns(suggestConcerns(val, country));
  };

  const canNext = [
    name.trim().length >= 2,
    industry !== "",
    country !== "" && size !== "",
    true,
    true,
  ][step];

  async function handleFinish() {
    await completeOnboarding.mutateAsync({
      data: {
        name,
        industry: industry as any,
        country,
        size: size as any,
        primaryConcerns: concerns,
        websiteUrl: websiteUrl || undefined,
      },
    });
    onComplete();
    setLocation("/websites");
  }

  const industryObj = INDUSTRIES.find(i => i.value === industry);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/8 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <Shield className="h-7 w-7 text-primary" />
          <span className="font-bold text-xl tracking-tight">BusinessShield AI</span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`h-2 rounded-full transition-all duration-300 ${
                i < step ? "bg-primary w-8" : i === step ? "bg-primary w-12" : "bg-muted w-6"
              }`} />
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {/* Step 0: Identity */}
            {step === 0 && (
              <div className="bg-card border border-border rounded-2xl p-8">
                <h1 className="text-2xl font-bold mb-1">Welcome to BusinessShield</h1>
                <p className="text-muted-foreground mb-8">Let's set up your compliance profile. We'll personalize everything to your specific business context.</p>
                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Company / Organization name *</label>
                    <Input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Acme Inc."
                      className="h-11"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Primary website URL <span className="text-muted-foreground font-normal">(optional — you can add later)</span></label>
                    <Input
                      value={websiteUrl}
                      onChange={e => setWebsiteUrl(e.target.value)}
                      placeholder="https://yourcompany.com"
                      className="h-11"
                    />
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10 flex gap-2.5 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Your data is private. We use this to personalize AI compliance advice — we never sell or share business information.</span>
                </div>
              </div>
            )}

            {/* Step 1: Industry */}
            {step === 1 && (
              <div className="bg-card border border-border rounded-2xl p-8">
                <h1 className="text-2xl font-bold mb-1">What's your industry?</h1>
                <p className="text-muted-foreground mb-6">This determines which compliance frameworks apply to your business — HIPAA, PCI-DSS, GDPR, and more.</p>
                <div className="grid grid-cols-3 gap-3">
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind.value}
                      onClick={() => handleIndustrySelect(ind.value)}
                      className={`rounded-xl border p-3 text-left transition-all duration-150 hover:scale-[1.02] ${
                        industry === ind.value
                          ? `${ind.bg} border-current`
                          : "border-border bg-card/50 hover:bg-card hover:border-muted-foreground/30"
                      }`}
                    >
                      <ind.icon className={`h-5 w-5 mb-2 ${industry === ind.value ? ind.color : "text-muted-foreground"}`} />
                      <div className={`text-sm font-medium ${industry === ind.value ? ind.color : ""}`}>{ind.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 leading-tight">{ind.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Country + Size */}
            {step === 2 && (
              <div className="bg-card border border-border rounded-2xl p-8">
                <h1 className="text-2xl font-bold mb-1">Where does your company operate?</h1>
                <p className="text-muted-foreground mb-6">Your jurisdiction determines your regulatory obligations — EU companies face GDPR, US companies CCPA, etc.</p>

                <div className="mb-6">
                  <label className="text-sm font-medium mb-3 block">Primary jurisdiction *</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {COUNTRIES.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => handleCountrySelect(c.value)}
                        className={`rounded-lg border px-3 py-2.5 text-sm text-left transition-all ${
                          country === c.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-muted-foreground/40 hover:bg-muted/30"
                        }`}
                      >
                        <span className="mr-1.5">{c.flag}</span>{c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-3 block">Team size *</label>
                  <div className="grid grid-cols-5 gap-2">
                    {TEAM_SIZES.map((ts) => (
                      <button
                        key={ts.value}
                        onClick={() => setSize(ts.value)}
                        className={`rounded-lg border px-3 py-3 text-center transition-all ${
                          size === ts.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-muted-foreground/40 hover:bg-muted/30"
                        }`}
                      >
                        <div className="text-sm font-semibold">{ts.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{ts.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Compliance concerns */}
            {step === 3 && (
              <div className="bg-card border border-border rounded-2xl p-8">
                <h1 className="text-2xl font-bold mb-1">What compliance matters most?</h1>
                <p className="text-muted-foreground mb-2">
                  We've pre-selected the most relevant frameworks for a <strong>{industryObj?.label}</strong> company in <strong>{COUNTRIES.find(c => c.value === country)?.label ?? country}</strong>. Adjust as needed.
                </p>
                {concerns.length > 0 && (
                  <div className="mb-4 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-sm text-primary">{concerns.length} framework{concerns.length !== 1 ? "s" : ""} selected — AI will prioritize these in all scans and advice</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {CONCERNS.map((c) => {
                    const selected = concerns.includes(c.value);
                    return (
                      <button
                        key={c.value}
                        onClick={() => toggleConcern(c.value)}
                        className={`rounded-xl border p-3.5 text-left transition-all duration-150 flex items-start gap-3 ${
                          selected
                            ? `${c.bg} border-current`
                            : "border-border bg-card/50 hover:bg-card hover:border-muted-foreground/30"
                        }`}
                      >
                        <c.icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${selected ? c.color : "text-muted-foreground"}`} />
                        <div>
                          <div className={`text-sm font-semibold ${selected ? c.color : ""}`}>{c.label}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{c.desc}</div>
                        </div>
                        {selected && (
                          <CheckCircle2 className={`h-4 w-4 ml-auto flex-shrink-0 ${c.color}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 4: Ready */}
            {step === 4 && (
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Your compliance profile is ready</h1>
                <p className="text-muted-foreground mb-6">
                  BusinessShield AI is configured for <strong>{name}</strong> — a <strong>{industryObj?.label}</strong> company in <strong>{COUNTRIES.find(c => c.value === country)?.label ?? country}</strong>.
                </p>

                <div className="bg-muted/30 rounded-xl p-4 text-left mb-6 space-y-2">
                  <div className="text-sm font-medium mb-3">Your personalized compliance stack:</div>
                  {concerns.length === 0 && (
                    <div className="text-sm text-muted-foreground">General web compliance monitoring (WCAG, security headers, privacy).</div>
                  )}
                  {concerns.map(c => {
                    const concern = CONCERNS.find(x => x.value === c);
                    if (!concern) return null;
                    return (
                      <div key={c} className="flex items-center gap-2 text-sm">
                        <concern.icon className={`h-4 w-4 ${concern.color}`} />
                        <span className="font-medium">{concern.label}</span>
                        <span className="text-muted-foreground">— {concern.desc}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="text-xs text-muted-foreground mb-6 p-3 rounded-lg bg-amber-400/5 border border-amber-400/10 flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>AI-generated compliance advice is for guidance purposes. Consult qualified legal and security professionals for binding compliance obligations.</span>
                </div>

                <Button
                  onClick={handleFinish}
                  disabled={completeOnboarding.isPending}
                  className="w-full h-11 gap-2 text-base"
                  size="lg"
                >
                  {completeOnboarding.isPending ? "Setting up..." : "Launch my compliance dashboard"}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="ghost"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          {step < 4 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext}
              className="gap-2"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : null}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Step {step + 1} of {STEPS.length} — {STEPS[step]}
        </p>
      </div>
    </div>
  );
}
