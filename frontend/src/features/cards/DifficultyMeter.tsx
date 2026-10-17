import { useI18n } from "@/i18n/context";
import type { Difficulty } from "@/types/api";
import { cn } from "@/utils/cn";

const LEVELS: Record<Difficulty, number> = { easy: 1, moderate: 2, challenging: 3, expert: 4 };

export function DifficultyMeter({ value, tone = "light", className }: { value: Difficulty; tone?: "light" | "dark"; className?: string }) {
  const { t } = useI18n();
  const level = LEVELS[value] ?? 2;
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="flex items-end gap-0.5" aria-hidden>
        {[1, 2, 3, 4].map((bar) => (
          <span
            key={bar}
            className={cn(
              "w-1 rounded-sm",
              bar <= level ? (tone === "dark" ? "bg-sand-300" : "bg-glacier-600") : tone === "dark" ? "bg-white/20" : "bg-graphite-200",
            )}
            style={{ height: `${6 + bar * 3}px` }}
          />
        ))}
      </span>
      <span>{t(`difficulty.${value}`)}</span>
    </span>
  );
}
