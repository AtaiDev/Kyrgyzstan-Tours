import { CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

import { Button } from "@/components/ui/Button";
import { CheckboxField } from "@/components/ui/Fields";
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
  return (
    <div role="status" className="flex flex-col items-center py-8 text-center">
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
