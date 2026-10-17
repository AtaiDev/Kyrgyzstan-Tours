import type { ReactNode } from "react";

import { LANGUAGE_META, LANGUAGES } from "@/i18n/languages";
import type { Language } from "@/i18n/languages";
import { cn } from "@/utils/cn";

export function PageHeader({ title, description, actions, eyebrow }: { title: string; description?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow ? <div className="mb-2 text-xs font-semibold tracking-wide text-graphite-500">{eyebrow}</div> : null}
        <h1 className="font-display text-4xl font-semibold text-night-900">{title}</h1>
        {description ? <div className="mt-2 max-w-3xl text-sm text-graphite-600">{description}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Card({ children, className, title, actions }: { children: ReactNode; className?: string; title?: string; actions?: ReactNode }) {
  return (
    <section className={cn("rounded-2xl border border-graphite-200 bg-white p-5 shadow-sm sm:p-6", className)}>
      {title || actions ? (
        <div className="mb-5 flex items-center justify-between gap-3">
          {title ? <h2 className="text-lg font-semibold text-night-900">{title}</h2> : <span />}
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function TranslationBadges({ missing }: { missing?: Language[] }) {
  return (
    <span className="inline-flex gap-1">
      {LANGUAGES.map((code) => {
        const absent = missing?.includes(code);
        return (
          <span
            key={code}
            title={absent ? `Нет перевода: ${LANGUAGE_META[code].native}` : `Перевод заполнен: ${LANGUAGE_META[code].native}`}
            className={cn(
              "rounded px-1.5 py-0.5 text-[0.62rem] font-bold tracking-wide",
              absent ? "bg-danger-100 text-danger-600" : "bg-success-100 text-success-700",
            )}
          >
            {LANGUAGE_META[code].short}
          </span>
        );
      })}
    </span>
  );
}

export function DemoBadge() {
  return (
    <span className="rounded-full bg-warning-100 px-2 py-0.5 text-[0.65rem] font-bold tracking-wide text-warning-700 uppercase" title="Демонстрационная запись — замените реальными данными">
      Пример
    </span>
  );
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (value: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-50",
        checked ? "bg-glacier-600" : "bg-graphite-300",
      )}
    >
      <span className={cn("inline-block h-5 w-5 rounded-full bg-white shadow transition", checked ? "translate-x-5" : "translate-x-0.5")} />
    </button>
  );
}

const STATUS_STYLES: Record<string, string> = {
  new: "bg-glacier-200/70 text-glacier-800",
  in_progress: "bg-warning-100 text-warning-700",
  confirmed: "bg-success-100 text-success-700",
  completed: "bg-graphite-100 text-graphite-700",
  cancelled: "bg-danger-100 text-danger-600",
  read: "bg-graphite-100 text-graphite-700",
  answered: "bg-success-100 text-success-700",
  archived: "bg-graphite-100 text-graphite-500",
  pending: "bg-warning-100 text-warning-700",
  approved: "bg-success-100 text-success-700",
  rejected: "bg-danger-100 text-danger-600",
  draft: "bg-graphite-100 text-graphite-700",
  published: "bg-success-100 text-success-700",
};

export const STATUS_LABELS: Record<string, string> = {
  new: "Новая",
  in_progress: "В работе",
  confirmed: "Подтверждена",
  completed: "Завершена",
  cancelled: "Отменена",
  read: "Прочитано",
  answered: "Отвечено",
  archived: "В архиве",
  pending: "На модерации",
  approved: "Опубликован",
  rejected: "Отклонён",
  draft: "Черновик",
  published: "Опубликована",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_STYLES[status] ?? "bg-graphite-100 text-graphite-700")}>{STATUS_LABELS[status] ?? status}</span>;
}
