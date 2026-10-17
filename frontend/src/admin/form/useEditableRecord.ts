import { useCallback, useMemo, useState } from "react";

import { ApiError } from "@/api/client";
import { LANGUAGES } from "@/i18n/languages";

import type { FieldConfig, FormSection } from "../resources/types";
import type { AdminRecord, Translations } from "../types";
import { describeError } from "../ui/feedback";
import type { FormErrors, FormValues } from "./values";
import { buildPayload, flattenFields, initialValues, toDateTimeInput, validateValues } from "./values";

function normalizeItem(fields: FieldConfig[], record: AdminRecord): FormValues {
  const translatedNames = fields.filter((field) => field.translated).map((field) => field.name);
  const source = (record.translations ?? {}) as Translations;
  const translations = translatedNames.length
    ? (Object.fromEntries(
        LANGUAGES.map((code) => [code, Object.fromEntries(translatedNames.map((name) => [name, source[code]?.[name] ?? ""]))]),
      ) as Translations)
    : source;
  const values: FormValues = { ...record, translations };
  for (const field of fields) {
    if (field.translated) continue;
    const value = record[field.name];
    if (field.type === "inline") values[field.name] = Array.isArray(value) ? value.map((item) => normalizeItem(field.fields, item as AdminRecord)) : [];
    else if (field.type === "datetime") values[field.name] = toDateTimeInput(value);
    else if (field.type === "password") values[field.name] = "";
    else if (value === null && ["text", "textarea", "email", "url", "slug", "markdown", "lines", "number", "decimal", "date", "color"].includes(field.type)) values[field.name] = "";
  }
  return values;
}

export function normalizeRecord(sections: FormSection[], record: AdminRecord): FormValues {
  return normalizeItem(flattenFields(sections), record);
}

function snapshot(fields: FieldConfig[], values: FormValues): string {
  return JSON.stringify(buildPayload(fields, values));
}

interface Options {
  sections: FormSection[];
  initial: AdminRecord | null;
  defaults?: Record<string, unknown>;
  save: (payload: Record<string, unknown>) => Promise<AdminRecord>;
  onSaved?: (record: AdminRecord) => void;
}

export function useEditableRecord({ sections, initial, defaults, save, onSaved }: Options) {
  const fields = useMemo(() => flattenFields(sections), [sections]);
  const isCreate = initial === null;
  const start = useMemo(() => (initial ? normalizeRecord(sections, initial) : initialValues(sections, defaults)), [initial, sections, defaults]);
  const [values, setValues] = useState<FormValues>(start);
  const [baseline, setBaseline] = useState(() => snapshot(fields, start));
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const dirty = snapshot(fields, values) !== baseline;

  const reset = useCallback(
    (record: AdminRecord) => {
      const next = normalizeRecord(sections, record);
      setValues(next);
      setBaseline(snapshot(fields, next));
      setErrors({});
      setGeneralError(null);
    },
    [sections, fields],
  );

  const submit = useCallback(async () => {
    const found = validateValues(fields, values, "", isCreate);
    setErrors(found);
    if (Object.keys(found).length) {
      setGeneralError("Исправьте ошибки в форме перед сохранением.");
      return null;
    }
    setSaving(true);
    setGeneralError(null);
    try {
      const saved = await save(buildPayload(fields, values));
      reset(saved);
      onSaved?.(saved);
      return saved;
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.fieldErrors).length) {
        const mapped: FormErrors = {};
        for (const [key, messages] of Object.entries(error.fieldErrors)) mapped[key] = messages[0];
        setErrors(mapped);
        setGeneralError("Сервер отклонил данные — проверьте поля, отмеченные красным.");
      } else {
        setGeneralError(describeError(error, "Не удалось сохранить запись"));
      }
      return null;
    } finally {
      setSaving(false);
    }
  }, [fields, values, isCreate, save, reset, onSaved]);

  return { values, setValues, errors, generalError, saving, dirty, submit, reset };
}
