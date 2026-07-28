import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Globe, Activity, FileText, FileSignature,
  Bell, Users, Settings, Key, ClipboardList, GitBranch,
  Search, ArrowRight, Shield, Plus,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, keywords: ["home", "overview"] },
  { label: "Websites", href: "/websites", icon: Globe, keywords: ["sites", "domain", "url"] },
  { label: "Monitoring", href: "/monitoring", icon: Activity, keywords: ["uptime", "schedule", "alerts"] },
  { label: "Reports", href: "/reports", icon: FileText, keywords: ["executive", "summary", "pdf"] },
  { label: "Policies", href: "/policies", icon: FileSignature, keywords: ["privacy", "gdpr", "terms", "legal"] },
  { label: "Alerts", href: "/alerts", icon: Bell, keywords: ["notifications", "warnings"] },
  { label: "Team", href: "/team", icon: Users, keywords: ["members", "invite", "roles"] },
  { label: "Developer", href: "/developer", icon: Key, keywords: ["api", "keys", "integration", "sdk"] },
  { label: "Audit Logs", href: "/audit-logs", icon: ClipboardList, keywords: ["history", "events", "security"] },
  { label: "Usage & Platform", href: "/billing", icon: GitBranch, keywords: ["usage", "open source", "roadmap"] },
  { label: "Settings", href: "/settings", icon: Settings, keywords: ["account", "profile", "preferences"] },
];

const ACTIONS = [
  { label: "Add Website", href: "/websites", icon: Plus, keywords: ["new site", "add", "create"] },
  { label: "View Alerts", href: "/alerts", icon: Bell, keywords: ["notifications"] },
];

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  const allItems = [...ACTIONS, ...NAV_ITEMS];
  const filtered = query
    ? allItems.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.keywords.some((k) => k.includes(query.toLowerCase()))
      )
    : allItems;

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  function navigate(href: string) {
    setLocation(href);
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      if (filtered[selected]) navigate(filtered[selected].href);
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-[18%] -translate-x-1/2 z-50 w-full max-w-xl"
          >
            <div className="rounded-2xl border border-border bg-card shadow-2xl shadow-black/40 overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
                <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search pages, actions, settings…"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                />
                <kbd className="hidden sm:inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto p-2">
                {filtered.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No results for "<span className="text-foreground">{query}</span>"
                  </div>
                ) : (
                  <>
                    {!query && (
                      <p className="px-3 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                        Quick Navigation
                      </p>
                    )}
                    {filtered.map((item, i) => (
                      <button
                        key={item.href + item.label}
                        onMouseEnter={() => setSelected(i)}
                        onClick={() => navigate(item.href)}
                        className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors text-left ${
                          selected === i ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/50"
                        }`}
                      >
                        <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${selected === i ? "bg-primary/20" : "bg-muted/60"}`}>
                          <item.icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="flex-1">{item.label}</span>
                        {selected === i && <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" />}
                      </button>
                    ))}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-border px-4 py-2 flex items-center gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3 text-primary" /> BusinessShield
                </span>
                <span className="ml-auto flex items-center gap-3">
                  <span>↑↓ Navigate</span>
                  <span>↵ Select</span>
                  <span>ESC Close</span>
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
