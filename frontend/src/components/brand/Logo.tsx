import { useId } from "react";

import type { Media } from "@/types/api";
import { cn } from "@/utils/cn";

interface LogoMarkProps {
  className?: string;
  tone?: "light" | "dark";
}

export function LogoMark({ className, tone = "dark" }: LogoMarkProps) {
  const clipId = useId();
  const peak = tone === "light" ? "#0b1524" : "#f7f2ea";
  return (
    <svg viewBox="0 0 64 64" className={cn("h-10 w-10 shrink-0", className)} aria-hidden>
      <defs>
        <clipPath id={clipId}>
          <circle cx="32" cy="32" r="25.5" />
        </clipPath>
      </defs>
      <circle cx="32" cy="32" r="25.5" fill="none" stroke="#d4b07a" strokeWidth="2.6" />
      <g clipPath={`url(#${clipId})`}>
        <circle cx="44" cy="20" r="4" fill="#d4b07a" />
        <path d="M4 50 L22 24 L30 34 L39 21 L60 50 L60 64 L4 64 Z" fill={peak} />
        <path d="M22 24 L26.6 30.6 L23.8 29.2 L21.6 31.4 L19.3 29.6 Z" fill="#4fc7b8" />
        <path d="M39 21 L43.6 27.6 L41.1 26.6 L38.6 28.6 L36 26.9 Z" fill="#4fc7b8" />
        <path d="M10 56 C 20 46, 32 52, 46 44" fill="none" stroke="#4fc7b8" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}

interface LogoProps {
  name?: string;
  logo?: Media | null;
  tone?: "light" | "dark";
  compact?: boolean;
  className?: string;
}

export function Logo({ name = "Kyrgyzstan-Tours", logo, tone = "dark", compact, className }: LogoProps) {
  if (logo) {
    return <img src={logo.medium_url} alt={name} className={cn("h-10 w-auto object-contain", className)} />;
  }
  const [first, ...rest] = name.split("-");
  const second = rest.join("-");
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <LogoMark tone={tone} />
      {compact ? (
        <span className="sr-only">{name}</span>
      ) : (
        <span className="flex flex-col leading-none">
          <span className={cn("font-display text-[1.45rem] font-semibold tracking-tight", tone === "dark" ? "text-milk-50" : "text-night-900")}>{first}</span>
          {second ? (
            <span className={cn("mt-2 text-[0.62rem] leading-none font-semibold tracking-[0.42em] uppercase", tone === "dark" ? "text-sand-300" : "text-sand-600")}>
              {second}
            </span>
          ) : null}
        </span>
      )}
    </span>
  );
}
