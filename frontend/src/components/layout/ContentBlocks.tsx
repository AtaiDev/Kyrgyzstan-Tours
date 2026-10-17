import type { ReactNode } from "react";

import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/utils/cn";

export function DetailSection({ title, children, className, id, tone = "light" }: { title?: string; children: ReactNode; className?: string; id?: string; tone?: "light" | "dark" }) {
  return (
    <Reveal as="section" className={cn("scroll-mt-28", className)}>
      <div id={id}>
        {title ? <h2 className={cn("mb-6 font-display text-3xl font-semibold sm:text-4xl", tone === "dark" ? "text-milk-50" : "text-night-900")}>{title}</h2> : null}
        {children}
      </div>
    </Reveal>
  );
}

export function FactList({ items, tone = "light" }: { items: Array<{ label: string; value: ReactNode; icon?: ReactNode }>; tone?: "light" | "dark" }) {
  const visible = items.filter((item) => item.value !== null && item.value !== undefined && item.value !== "");
  return (
    <dl className={cn("divide-y", tone === "dark" ? "divide-white/10" : "divide-graphite-200")}>
      {visible.map((item) => (
        <div key={item.label} className="flex items-start justify-between gap-6 py-3.5">
          <dt className={cn("flex items-center gap-2 text-sm", tone === "dark" ? "text-milk-200/70" : "text-graphite-500")}>
            {item.icon}
            {item.label}
          </dt>
          <dd className={cn("text-right text-sm font-semibold", tone === "dark" ? "text-milk-50" : "text-night-900")}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function BulletList({ items, tone = "light", marker = "dot" }: { items: string[]; tone?: "light" | "dark"; marker?: "dot" | "check" | "cross" }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className={cn("flex items-start gap-3", tone === "dark" ? "text-milk-100/90" : "text-graphite-800")}>
          {marker === "dot" ? <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-glacier-600" aria-hidden /> : null}
          {marker === "check" ? <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-100 text-xs text-success-700" aria-hidden>✓</span> : null}
          {marker === "cross" ? <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger-100 text-xs text-danger-600" aria-hidden>✕</span> : null}
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
