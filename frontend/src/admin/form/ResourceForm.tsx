import { AlertCircle, Save } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useBlocker } from "react-router";

import { Button } from "@/components/ui/Button";
import { LANGUAGES } from "@/i18n/languages";
import type { Language } from "@/i18n/languages";

import type { FormSection } from "../resources/types";
import { useFeedback } from "../ui/feedback";
import { FieldRenderer } from "./FieldRenderer";
import { LanguageTabs } from "./LanguageTabs";
import type { FormErrors, FormValues } from "./values";
import { ADMIN_LANGUAGE, flattenFields, languageHasErrors, missingLanguageCount } from "./values";

interface ResourceFormProps {
  sections: FormSection[];
  values: FormValues;
  onChange: (values: FormValues) => void;
  errors: FormErrors;
  onSubmit: () => void;
  saving: boolean;
  dirty: boolean;
  isNew?: boolean;
  readOnly?: boolean;
  submitLabel?: string;
  extraActions?: ReactNode;
  generalError?: string | null;
}

export function ResourceForm({ sections, values, onChange, errors, onSubmit, saving, dirty, isNew = false, readOnly, submitLabel = "Сохранить", extraActions, generalError }: ResourceFormProps) {
  const [language, setLanguage] = useState<Language>(ADMIN_LANGUAGE);
  const fields = useMemo(() => flattenFields(sections), [sections]);
  const hasTranslations = fields.some((field) => field.translated || (field.type === "inline" && field.fields.some((sub) => sub.translated)));
  const { confirm } = useFeedback();

  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && !saving && currentLocation.pathname !== nextLocation.pathname);

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    void confirm({ title: "Есть несохранённые изменения", message: "Если уйти со страницы, изменения будут потеряны.", confirmLabel: "Уйти без сохранения", danger: true }).then((leave) => {
      if (leave) blocker.proceed();
      else blocker.reset();
    });
  }, [blocker, confirm]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    const firstError = Object.keys(errors)[0];
    if (!firstError) return;
    const match = LANGUAGES.find((code) => firstError.includes(`translations.${code}.`));
    if (match) setLanguage(match);
  }, [errors]);

  const missing = Object.fromEntries(LANGUAGES.map((code) => [code, missingLanguageCount(fields, values, code)])) as Record<Language, number>;
  const languageErrors = Object.fromEntries(LANGUAGES.map((code) => [code, languageHasErrors(errors, code)])) as Record<Language, boolean>;
  const errorCount = Object.keys(errors).length;

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (!readOnly) onSubmit();
      }}
      className="space-y-6 pb-28"
    >
      {hasTranslations ? (
        <div className="sticky top-16 z-20 -mx-4 flex flex-wrap items-center gap-3 border-b border-graphite-200 bg-milk-100/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <span className="text-sm font-semibold text-graphite-700">Язык контента:</span>
          <LanguageTabs active={language} onChange={setLanguage} missing={missing} errors={languageErrors} />
          <span className="text-xs text-graphite-500">Поля без языковой метки общие для всех языков.</span>
        </div>
      ) : null}
      {generalError || errorCount ? (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-danger-600/30 bg-danger-100 p-4 text-sm text-danger-600">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">{generalError ?? "Проверьте выделенные поля."}</p>
            {errorCount ? <p className="mt-1 text-danger-600/80">Найдено ошибок: {errorCount}. Поля с ошибками отмечены красным; вкладки языков с ошибками — красной точкой.</p> : null}
          </div>
        </div>
      ) : null}
      {sections.map((section) => (
        <fieldset key={section.title} disabled={readOnly} className="rounded-2xl border border-graphite-200 bg-white p-5 shadow-sm sm:p-6">
          <legend className="sr-only">{section.title}</legend>
          <h2 className="text-lg font-semibold text-night-900">{section.title}</h2>
          {section.description ? <p className="mt-1 text-sm text-graphite-500">{section.description}</p> : null}
          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
            {section.fields.map((field) => (
              <FieldRenderer key={field.name} field={field} values={values} onChange={onChange} language={language} errors={errors} />
            ))}
          </div>
        </fieldset>
      ))}
      {!readOnly ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-graphite-200 bg-white/95 backdrop-blur-md lg:left-72">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <span className="text-sm text-graphite-500">{dirty ? "Есть несохранённые изменения" : isNew ? "Новая запись ещё не сохранена" : "Все изменения сохранены"}</span>
            <div className="flex flex-wrap gap-2">
              {extraActions}
              <Button type="submit" loading={saving} disabled={!dirty && !isNew && !saving} icon={<Save className="h-4 w-4" aria-hidden />}>
                {submitLabel}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}
