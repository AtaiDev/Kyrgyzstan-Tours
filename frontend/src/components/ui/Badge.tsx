import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

type Tone = "neutral" | "glacier" | "sand" | "night" | "light" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  neutral: "bg-graphite-100 text-graphite-700",
  glacier: "bg-glacier-200/60 text-glacier-800",
  sand: "bg-sand-200/70 text-sand-700",
  night: "bg-night-900 text-milk-100",
  light: "bg-night-950/45 text-white backdrop-blur-md border border-white/20",
  success: "bg-success-100 text-success-700",
  warning: "bg-warning-100 text-warning-700",
  danger: "bg-danger-100 text-danger-600",
};

export function Badge({ children, tone = "neutral", icon, className }: { children: ReactNode; tone?: Tone; icon?: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide", tones[tone], className)}>
      {icon}
      {children}
    </span>
  );
}
