import { useCallback, useState } from "react";

import { ApiError } from "@/api/client";
import { useI18n } from "@/i18n/context";

export type FormErrors<T> = Partial<Record<keyof T, string>>;
export type FormStatus = "idle" | "submitting" | "success" | "error";

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function useForm<T extends object>(initial: T, validate: (values: T) => FormErrors<T>) {
  const { t } = useI18n();
  const [values, setValues] = useState<T>(initial);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [status, setStatus] = useState<FormStatus>("idle");
  const [formError, setFormError] = useState<string | null>(null);

  const setField = useCallback(<K extends keyof T>(name: K, value: T[K]) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
  }, []);

  const reset = useCallback(() => {
    setValues(initial);
    setErrors({});
    setStatus("idle");
    setFormError(null);
  }, [initial]);

  const submit = useCallback(
    async (action: (values: T) => Promise<unknown>) => {
      const found = validate(values);
      const hasErrors = Object.values(found).some(Boolean);
      setErrors(found);
      if (hasErrors) {
        setFormError(t("form.errorFields"));
        setStatus("error");
        return false;
      }
      setStatus("submitting");
      setFormError(null);
      try {
        await action(values);
        setStatus("success");
        return true;
      } catch (error) {
        setStatus("error");
        if (error instanceof ApiError) {
          const mapped: FormErrors<T> = {};
          for (const [field, messages] of Object.entries(error.fieldErrors)) {
            const name = field.split(".")[0] as keyof T;
            if (name in values) mapped[name] = messages[0];
          }
          setErrors(mapped);
          if (error.isNetworkError) setFormError(t("form.errorNetwork"));
          else if (error.status === 429) setFormError(t("form.errorThrottled"));
          else if (Object.keys(mapped).length) setFormError(t("form.errorFields"));
          else setFormError(error.message || t("form.errorGeneric"));
        } else {
          setFormError(t("form.errorGeneric"));
        }
        return false;
      }
    },
    [values, validate, t],
  );

  return { values, errors, status, formError, setField, submit, reset };
}
