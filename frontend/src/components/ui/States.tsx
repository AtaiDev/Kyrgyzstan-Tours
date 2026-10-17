import { AlertTriangle, Compass, Loader2, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";

import { useI18n } from "@/i18n/context";
import { cn } from "@/utils/cn";

import { Button } from "./Button";

export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <span role="status" className={cn("inline-flex items-center gap-2 text-sm", className)}>
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      {label ? <span>{label}</span> : <span className="sr-only">Loading</span>}
    </span>
  );
}

export function BootLoader() {
  return (
    <div className="flex min-h-svh items-center justify-center text-graphite-500">
      <Spinner />
    </div>
  );
}

export function PageLoader() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-[60vh] items-center justify-center text-graphite-600">
      <Spinner label={t("common.loading")} />
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton", className)} />;
}

export function CardSkeletonGrid({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3", className)} aria-busy="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="space-y-4">
          <Skeleton className="aspect-[4/3] w-full rounded-[var(--radius-card)]" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, text, action, icon }: { title: string; text?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-graphite-300 bg-white/60 px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-milk-200 text-night-700">
        {icon ?? <Compass className="h-6 w-6" aria-hidden />}
      </div>
      <h3 className="font-display text-2xl font-semibold text-night-900">{title}</h3>
      {text ? <p className="mt-2 max-w-md text-graphite-600">{text}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ onRetry, message, tone = "light" }: { onRetry?: () => void; message?: string; tone?: "light" | "dark" }) {
  const { t } = useI18n();
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center rounded-[var(--radius-card)] px-6 py-14 text-center",
        tone === "dark" ? "bg-white/5 text-milk-100" : "bg-white/70 text-graphite-800",
      )}
    >
      <AlertTriangle className="mb-3 h-8 w-8 text-sand-500" aria-hidden />
      <h3 className="font-display text-2xl font-semibold">{t("common.errorTitle")}</h3>
      <p className={cn("mt-2 max-w-md", tone === "dark" ? "text-milk-200/80" : "text-graphite-600")}>{message ?? t("common.errorText")}</p>
      {onRetry ? (
        <Button className="mt-6" variant={tone === "dark" ? "light" : "outline"} icon={<RotateCcw className="h-4 w-4" />} onClick={onRetry}>
          {t("common.retry")}
        </Button>
      ) : null}
    </div>
  );
}
