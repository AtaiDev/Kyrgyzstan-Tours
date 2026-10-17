import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

import { Reveal } from "@/components/motion/Reveal";
import { useI18n } from "@/i18n/context";
import { cn } from "@/utils/cn";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  tone?: "light" | "dark";
  align?: "left" | "center";
  action?: { label: string; to: string } | null;
  children?: ReactNode;
  className?: string;
  level?: "h1" | "h2";
  id?: string;
}

export function SectionHeading({ eyebrow, title, subtitle, tone = "light", align = "left", action, children, className, level = "h2", id }: SectionHeadingProps) {
  const { path } = useI18n();
  const Title = level;
  return (
    <Reveal
      className={cn(
        "mb-12 flex flex-col gap-6 md:mb-16",
        align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className={cn("max-w-3xl", align === "center" && "mx-auto")}>
        {eyebrow ? <p className={cn("eyebrow mb-5", tone === "dark" ? "text-sand-300" : "text-glacier-700")}>{eyebrow}</p> : null}
        <Title id={id} className={cn("display-lg", tone === "dark" ? "text-milk-50" : "text-night-900")}>{title}</Title>
        {subtitle ? (
          <p className={cn("mt-5 max-w-2xl text-lg leading-relaxed", tone === "dark" ? "text-milk-200/80" : "text-graphite-600", align === "center" && "mx-auto")}>
            {subtitle}
          </p>
        ) : null}
        {children}
      </div>
      {action ? (
        <Link
          to={path(action.to)}
          className={cn(
            "group inline-flex shrink-0 items-center gap-2 text-sm font-semibold tracking-wide",
            tone === "dark" ? "text-milk-50" : "text-night-900",
          )}
        >
          <span className="border-b border-current pb-0.5">{action.label}</span>
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
        </Link>
      ) : null}
    </Reveal>
  );
}
