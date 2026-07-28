import { cva, type VariantProps } from "class-variance-authority";
import { Badge } from "@/components/ui/badge";

const badgeVariants = cva(
  "inline-flex items-center font-medium capitalize",
  {
    variants: {
      severity: {
        critical: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20",
        high: "bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20",
        medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20",
        low: "bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20",
        info: "bg-muted text-muted-foreground hover:bg-muted/80",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      }
    },
    defaultVariants: {
      severity: "info",
      size: "default",
    },
  }
);

interface SeverityBadgeProps {
  severity?: "critical" | "high" | "medium" | "low" | "info" | string | null | undefined;
  size?: "default" | "sm" | "lg" | null | undefined;
  className?: string;
  children?: React.ReactNode;
}

export function SeverityBadge({ severity, size, className, children }: SeverityBadgeProps) {
  const normalizedSeverity = (severity?.toLowerCase() || "info") as any;

  return (
    <Badge variant="outline" className={badgeVariants({ severity: normalizedSeverity, size, className })}>
      {children || severity}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: string | undefined | null }) {
  if (!status) return null;

  const variants: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20",
    paused: "bg-muted text-muted-foreground hover:bg-muted/80",
    error: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20",
    completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20",
    running: "bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20",
    queued: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20",
    failed: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20",
    generating: "bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20",
    ready: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20",
  };

  const className = variants[status.toLowerCase()] || variants.paused;

  return (
    <Badge variant="outline" className={`capitalize ${className}`}>
      {status}
    </Badge>
  );
}
