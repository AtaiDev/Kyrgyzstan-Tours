import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useId, useState } from "react";

import { ApiError } from "@/api/client";
import { publicApi } from "@/api/public";
import { Button } from "@/components/ui/Button";
import { inputClasses } from "@/components/ui/Fields";
import { useI18n } from "@/i18n/context";

import { EMAIL_PATTERN } from "./useForm";

export function NewsletterForm({ tone = "dark" }: { tone?: "light" | "dark" }) {
  const { t, language } = useI18n();
  const id = useId();
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "exists">("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError(t("form.invalidEmail"));
      return;
    }
    setState("sending");
    setError(null);
    try {
      const result = await publicApi.subscribe(language, email.trim(), website);
      setState(result.status === "already_subscribed" ? "exists" : "done");
    } catch (failure) {
      setState("idle");
      setError(failure instanceof ApiError && failure.isNetworkError ? t("form.errorNetwork") : t("form.errorGeneric"));
    }
  };

  if (state === "done" || state === "exists") {
    return (
      <p role="status" className="flex items-center gap-3 text-lg">
        <CheckCircle2 className="h-6 w-6 text-glacier-300" aria-hidden />
        {state === "done" ? t("newsletter.success") : t("newsletter.already")}
      </p>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="relative w-full max-w-xl">
      <div aria-hidden className="absolute -left-[9999px]">
        <input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
      </div>
      <label htmlFor={id} className="sr-only">
        {t("newsletter.placeholder")}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id={id}
          type="email"
          autoComplete="email"
          placeholder={t("newsletter.placeholder")}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setError(null);
          }}
          aria-invalid={Boolean(error)}
          className={inputClasses(tone, Boolean(error))}
        />
        <Button type="submit" variant={tone === "dark" ? "accent" : "primary"} size="lg" loading={state === "sending"}>
          {t("newsletter.submit")}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-danger-600">
          {error}
        </p>
      ) : (
        <p className={tone === "dark" ? "mt-3 text-xs text-milk-200/60" : "mt-3 text-xs text-graphite-500"}>{t("newsletter.privacy")}</p>
      )}
    </form>
  );
}
