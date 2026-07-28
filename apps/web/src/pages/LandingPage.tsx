import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Shield, Sparkles, CheckCircle2, ChevronRight, Lock, Eye, Zap, FileText,
  Globe, Activity, BarChart3, ArrowRight, ChevronDown, Key,
  AlertTriangle, TrendingUp, GitBranch, Terminal, Server, ExternalLink,
  DollarSign, Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  {
    icon: Eye,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    title: "WCAG / ADA Accessibility",
    desc: "Automated WCAG 2.1 AA/AAA scanning across 200+ criteria. Stop being one of the 4,000+ companies sued for accessibility violations every year.",
  },
  {
    icon: Lock,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    title: "GDPR & CCPA Privacy",
    desc: "Detect unconsented trackers, missing cookie banners, exposed PII, and data retention violations — before the €20M fine arrives.",
  },
  {
    icon: Shield,
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    title: "Security Headers",
    desc: "Monitor SSL certificates, HSTS, CSP, X-Frame-Options, and OWASP Top 10 attack vectors continuously.",
  },
  {
    icon: FileText,
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    title: "Policy Generation",
    desc: "Generate Privacy Policies, Cookie Policies, and Terms of Service based on your actual site in seconds — not weeks with consultants.",
  },
  {
    icon: Shield,
    color: "text-primary",
    bg: "bg-primary/10",
    title: "Compliance Copilot",
    desc: "Get actionable fixes, regulatory citations, and remediation steps for your compliance findings — instantly.",
  },
  {
    icon: Activity,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    title: "Continuous Monitoring",
    desc: "Schedule automated scans daily, weekly, or monthly. Get alerted the moment your compliance posture changes.",
  },
  {
    icon: BarChart3,
    color: "text-pink-400",
    bg: "bg-pink-400/10",
    title: "Executive Reports",
    desc: "One-click compliance reports ready for board meetings, SOC 2 auditors, and enterprise customer security reviews.",
  },
  {
    icon: Key,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    title: "REST API & Webhooks",
    desc: "Integrate compliance scanning directly into CI/CD pipelines. Fail builds on critical findings before they reach production.",
  },
];

const REAL_STATS = [
  { value: "4,000+", label: "ADA lawsuits filed in 2024", source: "EcomBack / UsableNet", icon: Scale, color: "text-red-400" },
  { value: "€1.2B", label: "GDPR fines issued in 2024", source: "GDPR Enforcement Tracker", icon: DollarSign, color: "text-orange-400" },
  { value: "200+", label: "Automated compliance checks", source: "WCAG, GDPR, CCPA, OWASP", icon: Shield, color: "text-primary" },
  { value: "MIT", label: "Fully open-source license", source: "Self-host on your own infrastructure", icon: GitBranch, color: "text-green-400" },
];

const COMPLIANCE_RISKS = [
  { regulation: "GDPR", scope: "Any company handling EU citizen data", maxFine: "€20M or 4% of global revenue", risk: "critical", color: "bg-red-500" },
  { regulation: "ADA Title III", scope: "Any US-accessible website", maxFine: "$75k–$150k per violation", risk: "critical", color: "bg-red-500" },
  { regulation: "CCPA", scope: "Companies with CA users (>$25M revenue / 100k+ users)", maxFine: "$7,500 per intentional violation", risk: "high", color: "bg-orange-500" },
  { regulation: "WCAG 2.1 AA", scope: "All public-facing websites", maxFine: "Lawsuit exposure + reputational damage", risk: "high", color: "bg-orange-500" },
];

const COMPARISON = [
  { feature: "Licensing model", bs: "Open source (MIT)", vanta: "Closed source", drata: "Closed source", onetrust: "Closed source" },
  { feature: "Deployment", bs: "Self-hosted or managed", vanta: "SaaS only", drata: "SaaS only", onetrust: "SaaS only" },
  { feature: "WCAG accessibility scanning", bs: "200+ checks", vanta: "Not covered", drata: "Not covered", onetrust: "Partial" },
  { feature: "Compliance Copilot", bs: "Included", vanta: "Partial", drata: "Partial", onetrust: "Add-on" },
  { feature: "Policy generation", bs: "Included", vanta: "Not included", drata: "Not included", onetrust: "Partial" },
  { feature: "Security headers (CSP, HSTS)", bs: "Real-time", vanta: "Partial", drata: "Partial", onetrust: "Not covered" },
  { feature: "Data residency", bs: "Fully under your control", vanta: "Vendor-hosted", drata: "Vendor-hosted", onetrust: "Vendor-hosted" },
];

const FAQS = [
  {
    q: "Is this actually free? What's the catch?",
    a: "BusinessShield is MIT-licensed open source software. The code is fully public. You can self-host it on your own infrastructure at zero cost. There is no catch, no hidden tier, no credit card required — ever. The project is community-driven.",
  },
  {
    q: "How is this different from Google Lighthouse?",
    a: "Lighthouse covers basic accessibility and performance only. BusinessShield adds GDPR/CCPA compliance, security headers, legal policy generation, an AI copilot with regulatory context, continuous monitoring, team collaboration, and audit trails — all in one platform.",
  },
  {
    q: "Do I need a lawyer to use the generated policies?",
    a: "AI-generated policies are a strong starting point based on your actual site structure and industry. We always recommend having legal counsel review before publishing. They are not a substitute for legal advice.",
  },
  {
    q: "Why should I trust open-source compliance software?",
    a: "Open source means the logic is fully auditable — you can see exactly what every check does and why. There are no black-box algorithms making opaque compliance decisions. Your compliance data stays under your control, on your infrastructure.",
  },
  {
    q: "Can I integrate this into my CI/CD pipeline?",
    a: "Yes. The REST API is fully documented and lets you trigger scans, fetch findings, and block deployments on critical compliance failures — directly from GitHub Actions, GitLab CI, or any webhook-capable pipeline.",
  },
  {
    q: "What regulations does it cover?",
    a: "Currently: WCAG 2.1 AA/AAA (ADA/EAA), GDPR, CCPA, OWASP Top 10 security headers, SSL/TLS hygiene, and SEO compliance. EU AI Act checks are on the roadmap for Q3 2026.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        className="flex w-full items-center justify-between py-5 text-left text-sm font-medium hover:text-foreground text-foreground/80 transition-colors"
        onClick={() => setOpen(!open)}
      >
        {q}
        <ChevronDown className={`h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform ml-4 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="text-sm text-muted-foreground pb-5 leading-relaxed"
        >
          {a}
        </motion.p>
      )}
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Navbar */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <span className="text-base font-bold tracking-tight">BusinessShield</span>
            <Badge variant="outline" className="ml-1 text-[10px] border-green-500/30 text-green-400 bg-green-500/5 hidden sm:flex">
              Open Source
            </Badge>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#compare" className="hover:text-foreground transition-colors">Comparison</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
            <a href="#self-host" className="hover:text-foreground transition-colors">Self-host</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-foreground hidden sm:block">
              Sign In
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="gap-1.5">
                Get Started Free <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-36 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[700px] bg-primary/15 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-violet-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Badge variant="outline" className="border-green-500/30 bg-green-500/5 text-green-400 gap-1.5 px-3 py-1 mb-6">
                <GitBranch className="h-3.5 w-3.5" />
                Free & Open Source — MIT License
              </Badge>
            </motion.div>

            <motion.h1
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tighter mb-6 leading-[1.05]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span className="bg-gradient-to-br from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
                Enterprise-grade compliance,
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                open by design.
              </span>
            </motion.h1>

            <motion.p
              className="text-lg sm:text-xl text-muted-foreground mb-4 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
               BusinessShield is the open-source compliance platform for B2B SaaS teams. WCAG accessibility,
               GDPR/CCPA privacy, security headers, policy generation, and continuous monitoring — unified in one platform.
            </motion.p>

            <motion.p
              className="text-sm text-muted-foreground/70 mb-10 max-w-xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              MIT-licensed and self-hostable. Deploy on your own infrastructure, audit every line of the compliance
              logic, and keep sensitive scan data under your control.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Link href="/sign-up">
                <Button size="lg" className="h-12 px-8 text-base gap-2 group shadow-lg shadow-primary/20">
                  Start Scanning Free
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <a href="#self-host">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base gap-2 bg-background/50">
                  <Terminal className="h-4 w-4" />
                  Deploy in 5 minutes
                </Button>
              </a>
            </motion.div>

            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                MIT licensed — forever free
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                No credit card, ever
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                First scan in 60 seconds
              </div>
            </motion.div>
          </div>

          {/* Dashboard preview */}
          <motion.div
            className="mt-16 relative max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background z-10 pointer-events-none" />
            <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/30">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border/60 bg-muted/20">
                <div className="h-3 w-3 rounded-full bg-red-500/60" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                <div className="h-3 w-3 rounded-full bg-green-500/60" />
                <div className="flex-1 mx-4 h-6 rounded-md bg-muted/40 flex items-center px-3">
                  <span className="text-xs text-muted-foreground/60">app.businessshield.io/dashboard</span>
                </div>
              </div>
              <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Risk Score", value: "72", change: "3 critical issues", color: "text-amber-400", bg: "bg-amber-400/10" },
                  { label: "Compliance", value: "84%", change: "↑ up from last scan", color: "text-green-400", bg: "bg-green-400/10" },
                  { label: "Issues Found", value: "23", change: "8 new since Monday", color: "text-red-400", bg: "bg-red-400/10" },
                  { label: "Websites", value: "3", change: "monitoring active", color: "text-primary", bg: "bg-primary/10" },
                ].map((stat) => (
                  <div key={stat.label} className={`rounded-xl ${stat.bg} border border-border/30 p-4`}>
                    <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
                  <p className="text-xs font-medium mb-3 text-muted-foreground uppercase tracking-wider">Latest Findings</p>
                  {[
                    { sev: "critical", text: "Missing ARIA labels on 14 form elements (WCAG 1.3.1)" },
                    { sev: "critical", text: "Google Analytics loaded without cookie consent (GDPR Art. 7)" },
                    { sev: "high", text: "SSL certificate expires in 23 days" },
                  ].map((f) => (
                    <div key={f.text} className="flex items-start gap-2 mb-2 last:mb-0">
                      <span className={`mt-0.5 flex-shrink-0 h-2 w-2 rounded-full ${f.sev === "critical" ? "bg-red-500" : "bg-orange-500"}`} />
                      <span className="text-xs text-muted-foreground">{f.text}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
                  <p className="text-xs font-medium mb-3 text-muted-foreground uppercase tracking-wider">Compliance Copilot</p>
                  <div className="space-y-2">
                    <div className="rounded-lg bg-primary/5 border border-primary/10 px-3 py-2 text-xs text-muted-foreground">
                      "Your GDPR score dropped 8pts. Google Analytics is loading before consent on 3 pages — this is an Art. 7 violation."
                    </div>
                    <div className="rounded-lg bg-muted/30 px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
                      <Shield className="h-3 w-3 text-primary flex-shrink-0" />
                      Show me the fix with code examples →
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Real market crisis stats */}
      <section className="py-16 border-y border-border/40 bg-card/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-10">
            The compliance crisis — by the numbers
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {REAL_STATS.map((stat, i) => (
              <motion.div
                key={stat.value}
                className="text-center p-6 rounded-2xl bg-background border border-border hover:border-border/80 transition-all"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <stat.icon className={`h-6 w-6 ${stat.color} mx-auto mb-3`} />
                <p className={`text-3xl md:text-4xl font-bold ${stat.color} mb-1`}>{stat.value}</p>
                <p className="text-sm font-medium text-foreground mb-1">{stat.label}</p>
                <p className="text-xs text-muted-foreground/60">{stat.source}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance risk table */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="outline" className="border-red-500/30 bg-red-500/5 text-red-400 mb-4">
              <AlertTriangle className="h-3 w-3 mr-1" /> Real regulatory exposure
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Regulations that can end your company
            </h2>
            <p className="text-muted-foreground text-sm">
              If your product has a website — and it does — every one of these applies to you.
            </p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left py-4 px-6 text-muted-foreground font-medium">Regulation</th>
                  <th className="text-left py-4 px-6 text-muted-foreground font-medium">Who it applies to</th>
                  <th className="text-left py-4 px-6 text-muted-foreground font-medium">Maximum penalty</th>
                  <th className="text-left py-4 px-6 text-muted-foreground font-medium">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {COMPLIANCE_RISKS.map((row) => (
                  <tr key={row.regulation} className="hover:bg-muted/10 transition-colors">
                    <td className="py-4 px-6 font-semibold">{row.regulation}</td>
                    <td className="py-4 px-6 text-muted-foreground">{row.scope}</td>
                    <td className="py-4 px-6 font-mono text-sm text-red-400">{row.maxFine}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                        row.risk === "critical" ? "bg-red-500/10 text-red-400" : "bg-orange-500/10 text-orange-400"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${row.color}`} />
                        {row.risk}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground/50 text-center mt-4">
            Sources: GDPR Enforcement Tracker, EcomBack 2024 Annual Report, California AG, WCAG Working Group
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-card/30 border-y border-border/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary mb-4">
              Full compliance stack
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              A complete compliance platform
            </h2>
            <p className="text-muted-foreground">
              No annual contracts. No per-seat pricing. No vendor lock-in.
              Deploy, scan, and monitor — all on infrastructure you control.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                className="p-5 rounded-2xl bg-background border border-border hover:border-primary/20 transition-all group"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <div className={`h-10 w-10 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                  <f.icon className={`h-5 w-5 ${f.color}`} />
                </div>
                <h3 className="text-sm font-semibold mb-2">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* vs. Competitors */}
      <section id="compare" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary mb-4">
              How we compare
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              An open, self-hostable alternative
            </h2>
            <p className="text-muted-foreground text-sm">
              Established compliance platforms are strong products, typically delivered as closed-source SaaS
              with enterprise pricing. BusinessShield covers the same core compliance surface as open-source,
              self-hostable software.
            </p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-6 text-muted-foreground font-medium w-56">Feature</th>
                  <th className="py-4 px-6 text-center bg-primary/5">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1.5 font-bold text-primary">
                        <Shield className="h-4 w-4" /> BusinessShield
                      </div>
                      <Badge className="text-[10px] bg-green-500/10 text-green-400 border-green-500/20">Open Source</Badge>
                    </div>
                  </th>
                  <th className="py-4 px-6 text-center text-muted-foreground font-normal">Vanta</th>
                  <th className="py-4 px-6 text-center text-muted-foreground font-normal">Drata</th>
                  <th className="py-4 px-6 text-center text-muted-foreground font-normal">OneTrust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {COMPARISON.map((row) => (
                  <tr key={row.feature} className="hover:bg-muted/10 transition-colors">
                    <td className="py-3.5 px-6 text-muted-foreground">{row.feature}</td>
                    <td className="py-3.5 px-6 text-center bg-primary/5 font-medium text-foreground">{row.bs}</td>
                    <td className="py-3.5 px-6 text-center text-muted-foreground">{row.vanta}</td>
                    <td className="py-3.5 px-6 text-center text-muted-foreground">{row.drata}</td>
                    <td className="py-3.5 px-6 text-center text-muted-foreground">{row.onetrust}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground/50 text-center mt-4">
            Feature comparison based on publicly available product documentation as of Q2 2026.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-card/30 border-y border-border/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary mb-4">
              How it works
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              From URL to compliance report in 60 seconds
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-1/4 right-1/4 h-px bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />
            {[
              { step: "1", icon: Globe, title: "Add your website", desc: "Enter any URL. We crawl it and run 200+ compliance checks across WCAG, GDPR, CCPA, security headers, and legal requirements." },
              { step: "2", icon: Zap, title: "Analyze the risk", desc: "Prioritize findings by legal exposure, business impact, and fix complexity — specific to your industry and jurisdiction." },
              { step: "3", icon: TrendingUp, title: "Fix, generate, monitor", desc: "Get code-level fix suggestions, auto-generate compliance policies, and schedule continuous monitoring with alerting." },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                className="text-center relative"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mx-auto mb-4 relative z-10">
                  <s.icon className="h-7 w-7 text-primary" />
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                    {s.step}
                  </span>
                </div>
                <h3 className="font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Self-host section */}
      <section id="self-host" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="outline" className="border-green-500/30 bg-green-500/5 text-green-400 mb-4">
                <Server className="h-3 w-3 mr-1.5" /> Self-hostable
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Your compliance data stays on your infrastructure.
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Compliance data is sensitive — vulnerability lists, audit findings, risk assessments.
                With BusinessShield, you deploy on your own servers. Nothing leaves your environment
                unless you choose to export it.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Docker compose deployment in 5 minutes",
                  "PostgreSQL database you control",
                  "No data ever sent to third-party servers",
                  "Air-gap deployable for regulated industries",
                  "Full source code auditable under MIT license",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/sign-up">
                  <Button className="gap-2">
                    <Shield className="h-4 w-4" />
                    Use hosted version (free)
                  </Button>
                </Link>
                <Button variant="outline" className="gap-2" asChild>
                  <a href="/developer">
                    <Terminal className="h-4 w-4" />
                    View API docs
                    <ExternalLink className="h-3 w-3 ml-1 text-muted-foreground" />
                  </a>
                </Button>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card/40 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/20">
                <Terminal className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-mono">Quick deploy</span>
              </div>
              <div className="p-6 font-mono text-xs space-y-3">
                <div>
                  <span className="text-muted-foreground/60"># Clone the repository</span>
                </div>
                <div>
                  <span className="text-green-400">$</span>
                  <span className="text-foreground ml-2">git clone https://github.com/businessshield/businessshield</span>
                </div>
                <div>
                  <span className="text-green-400">$</span>
                  <span className="text-foreground ml-2">cd businessshield</span>
                </div>
                <div className="mt-2">
                  <span className="text-muted-foreground/60"># Configure your environment</span>
                </div>
                <div>
                  <span className="text-green-400">$</span>
                  <span className="text-foreground ml-2">cp .env.example .env</span>
                </div>
                <div className="mt-2">
                  <span className="text-muted-foreground/60"># Start with Docker</span>
                </div>
                <div>
                  <span className="text-green-400">$</span>
                  <span className="text-foreground ml-2">docker compose up -d</span>
                </div>
                <div className="mt-4 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
                  ✓ BusinessShield running on http://localhost:3000
                </div>
                <div className="px-3 py-2 rounded-lg bg-muted/30 text-muted-foreground">
                  <span className="text-muted-foreground/60"># That's it. Add your first website.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Open source CTA */}
      <section className="py-20 border-y border-border/40 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: GitBranch,
                color: "text-green-400",
                bg: "bg-green-400/10",
                title: "MIT Licensed",
                desc: "Use it commercially. Modify it. Fork it. The license has no restrictions.",
              },
              {
                icon: Globe,
                color: "text-blue-400",
                bg: "bg-blue-400/10",
                title: "Community Rules",
                desc: "Compliance checks are contributed by a community of engineers, lawyers, and security researchers.",
              },
              {
                icon: Shield,
                color: "text-primary",
                bg: "bg-primary/10",
                title: "Transparent Logic",
                desc: "Every check is auditable source code. No black-box algorithms making opaque compliance decisions.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                className="p-6 rounded-2xl bg-background border border-border text-center"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className={`h-12 w-12 rounded-2xl ${item.bg} flex items-center justify-center mx-auto mb-4`}>
                  <item.icon className={`h-6 w-6 ${item.color}`} />
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary mb-4">
                FAQ
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight">Common questions</h2>
            </div>
            <div className="rounded-2xl border border-border bg-card/20 px-6">
              {FAQS.map((f) => <FaqItem key={f.q} {...f} />)}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary mb-6">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Free. Forever.
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">
              Stop waiting for a{" "}
              <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                compliance incident
              </span>{" "}
              to take this seriously.
            </h2>
            <p className="text-muted-foreground text-lg mb-3 max-w-2xl mx-auto">
              4,000 ADA lawsuits and €1.2B in GDPR fines were issued in 2024 alone.
              Get ahead of compliance risk before it becomes an incident.
            </p>
            <p className="text-muted-foreground/60 text-sm mb-10">
              BusinessShield is open source and self-hostable. Start scanning in 60 seconds.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/sign-up">
                <Button size="lg" className="h-12 px-10 text-base gap-2 group shadow-lg shadow-primary/20">
                  Start Scanning Free
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base gap-2" asChild>
                <a href="/developer">
                  <Terminal className="h-4 w-4" />
                  Read the API docs
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-10 bg-card/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                <Shield className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm font-bold">BusinessShield</span>
              <span className="text-xs text-muted-foreground/50">MIT License</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-muted-foreground/60">
              <span>Open source compliance platform</span>
              <span>·</span>
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <span>·</span>
              <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
              <span>·</span>
              <Link href="/developer" className="hover:text-foreground transition-colors">API</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
