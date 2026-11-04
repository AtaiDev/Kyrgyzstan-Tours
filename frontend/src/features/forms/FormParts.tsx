import { CheckCircle2, Minus, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";
import { Link } from "react-router";

import { Button } from "@/components/ui/Button";
import { CheckboxField, FieldShell } from "@/components/ui/Fields";
import { useI18n } from "@/i18n/context";
import { cn } from "@/utils/cn";

export function Honeypot({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Website
        <input tabIndex={-1} autoComplete="off" value={value} onChange={(event) => onChange(event.target.value)} />
      </label>
    </div>
  );
}

export function ConsentField({ checked, onChange, error, tone = "light" }: { checked: boolean; onChange: (value: boolean) => void; error?: string; tone?: "light" | "dark" }) {
  const { t, path } = useI18n();
  return (
    <CheckboxField
      tone={tone}
      className="sm:col-span-2"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      error={error}
      label={
        <>
          {t("form.consent")}{" "}
          <Link to={path("/privacy")} target="_blank" className={cn("underline underline-offset-4", tone === "dark" ? "text-sand-300" : "text-glacier-700")}>
            {t("form.privacyLink")}
          </Link>
        </>
      }
    />
  );
}

export function FormAlert({ message, tone = "light" }: { message: string | null; tone?: "light" | "dark" }) {
  if (!message) return null;
  return (
    <p role="alert" className={cn("rounded-xl px-4 py-3 text-sm", tone === "dark" ? "bg-danger-600/20 text-milk-50" : "bg-danger-100 text-danger-600")}>
      {message}
    </p>
  );
}

export function FormSuccess({ title, text, action, tone = "light" }: { title: string; text: string; action?: ReactNode; tone?: "light" | "dark" }) {
  const ref = useRef<HTMLDivElement>(null);
  // The confirmation replaces a much taller form, so bring it into view: otherwise the visitor may be left looking at
  // empty space below it, unsure whether the request went through.
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.scrollIntoView({ block: "nearest", behavior: "smooth" });
    element.focus({ preventScroll: true });
  }, []);
  return (
    <div ref={ref} tabIndex={-1} role="status" className="flex flex-col items-center py-8 text-center focus:outline-none">
      <CheckCircle2 className={cn("mb-4 h-14 w-14", tone === "dark" ? "text-glacier-300" : "text-glacier-600")} aria-hidden />
      <h3 className="font-display text-3xl font-semibold">{title}</h3>
      <p className={cn("mt-3 max-w-md", tone === "dark" ? "text-milk-200/80" : "text-graphite-600")}>{text}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function SubmitButton({ submitting, children, variant = "primary" }: { submitting: boolean; children: ReactNode; variant?: "primary" | "accent" }) {
  const { t } = useI18n();
  return (
    <Button type="submit" variant={variant} size="lg" loading={submitting} className="w-full sm:w-auto">
      {submitting ? t("form.sending") : children}
    </Button>
  );
}

/** One-click choice between a few options (radio inputs styled as chips, so arrow keys work natively). */
export function ChoiceField<T extends string>({
  label,
  name,
  value,
  options,
  onChange,
  tone = "light",
  className,
}: {
  label: string;
  name: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  tone?: "light" | "dark";
  className?: string;
}) {
  const dark = tone === "dark";
  return (
    <fieldset className={className}>
      <legend className={cn("mb-1.5 text-sm font-semibold", dark ? "text-milk-100" : "text-graphite-800")}>{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <label
              key={option.value}
              className={cn(
                "cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition duration-200 has-[:focus-visible]:ring-2",
                dark ? "has-[:focus-visible]:ring-sand-400/50" : "has-[:focus-visible]:ring-glacier-500/40",
                checked
                  ? dark
                    ? "border-sand-400 bg-sand-400 text-night-950"
                    : "border-night-900 bg-night-900 text-milk-50"
                  : dark
                    ? "border-white/15 bg-white/5 text-milk-100 hover:border-white/35"
                    : "border-graphite-200 bg-white text-graphite-700 hover:border-graphite-400",
              )}
            >
              <input type="radio" name={name} value={option.value} checked={checked} onChange={() => onChange(option.value)} className="sr-only" />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Number input with − / + buttons for small counts such as travellers. */
export function StepperField({
  label,
  value,
  onChange,
  min = 1,
  max = 60,
  error,
  tone = "light",
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  error?: string;
  tone?: "light" | "dark";
}) {
  const { t } = useI18n();
  const id = useId();
  const dark = tone === "dark";
  const clamp = (next: number) => Math.min(max, Math.max(min, Math.round(next) || min));
  const button = cn("flex w-12 shrink-0 items-center justify-center transition disabled:cursor-not-allowed disabled:opacity-30", dark ? "hover:bg-white/10" : "hover:bg-night-900/5");
  return (
    <FieldShell id={id} label={label} error={error} tone={tone}>
      <div className={cn("flex h-12 items-stretch overflow-hidden rounded-xl border", error ? "border-danger-600" : dark ? "border-white/15 bg-white/5" : "border-graphite-200 bg-white")}>
        <button type="button" onClick={() => onChange(clamp(value - 1))} disabled={value <= min} aria-label={t("form.decrease")} className={button}>
          <Minus className="h-4 w-4" aria-hidden />
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value || ""}
          aria-invalid={Boolean(error)}
          onChange={(event) => onChange(Number(event.target.value))}
          onBlur={() => onChange(clamp(value))}
          className={cn(
            "w-full min-w-0 [appearance:textfield] bg-transparent text-center text-[0.95rem] font-semibold focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
            dark ? "text-milk-50" : "text-graphite-900",
          )}
        />
        <button type="button" onClick={() => onChange(clamp(value + 1))} disabled={value >= max} aria-label={t("form.increase")} className={button}>
          <Plus className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </FieldShell>
  );
}
