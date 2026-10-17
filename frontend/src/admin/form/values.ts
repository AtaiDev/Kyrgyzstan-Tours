import type { Language } from "@/i18n/languages";
import { LANGUAGES } from "@/i18n/languages";

import type { FieldConfig, FormSection } from "../resources/types";
import type { AdminRecord, Translations } from "../types";

export type FormValues = AdminRecord;
export type FormErrors = Record<string, string>;

export const ADMIN_LANGUAGE: Language = "ru";

const URL_PATTERN = /^(https?:\/\/|\/)[^\s]*$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export function flattenFields(sections: FormSection[]): FieldConfig[] {
  return sections.flatMap((section) => section.fields);
}

export function translationOf(values: FormValues, language: Language, name: string): string {
  const translations = (values.translations ?? {}) as Translations;
  return translations[language]?.[name] ?? "";
}

export function readField(values: FormValues, field: FieldConfig, language: Language): unknown {
  return field.translated ? translationOf(values, language, field.name) : values[field.name];
}

export function writeField(values: FormValues, field: FieldConfig, language: Language, value: unknown): FormValues {
  if (!field.translated) return { ...values, [field.name]: value };
  const translations = { ...((values.translations ?? {}) as Translations) };
  translations[language] = { ...(translations[language] ?? {}), [field.name]: String(value ?? "") };
  return { ...values, translations };
}

function emptyTranslations(fields: FieldConfig[]): Translations {
  const translated = fields.filter((field) => field.translated);
  if (!translated.length) return {};
  return Object.fromEntries(LANGUAGES.map((code) => [code, Object.fromEntries(translated.map((field) => [field.name, ""]))])) as Translations;
}

export function initialValues(sections: FormSection[], defaults: Record<string, unknown> = {}): FormValues {
  const fields = flattenFields(sections);
  const values: FormValues = { translations: emptyTranslations(fields) };
  for (const field of fields) {
    if (field.translated) continue;
    if (field.type === "boolean") values[field.name] = false;
    else if (field.type === "relations" || field.type === "gallery" || field.type === "inline") values[field.name] = [];
    else if (field.type === "image" || field.type === "video" || field.type === "relation") values[field.name] = null;
    else values[field.name] = "";
  }
  return { ...values, ...defaults };
}

function mediaId(value: unknown): number | null {
  if (value && typeof value === "object" && "id" in value) return Number((value as { id: number }).id);
  if (typeof value === "number") return value;
  return null;
}

function numeric(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function serializeTranslations(fields: FieldConfig[], values: FormValues): Translations | undefined {
  const translated = fields.filter((field) => field.translated);
  if (!translated.length) return undefined;
  return Object.fromEntries(
    LANGUAGES.map((code) => [code, Object.fromEntries(translated.map((field) => [field.name, translationOf(values, code, field.name)]))]),
  ) as Translations;
}

export function buildPayload(fields: FieldConfig[], values: FormValues): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const translations = serializeTranslations(fields, values);
  if (translations) payload.translations = translations;
  for (const field of fields) {
    if (field.translated) continue;
    const value = values[field.name];
    switch (field.type) {
      case "image":
      case "video":
        payload[field.name] = mediaId(value);
        break;
      case "gallery":
        payload[field.name] = Array.isArray(value) ? value.map(mediaId).filter((id): id is number => id !== null) : [];
        break;
      case "relation":
        payload[field.name] = value === "" || value === undefined ? null : value;
        break;
      case "relations":
        payload[field.name] = Array.isArray(value) ? value : [];
        break;
      case "number":
      case "range":
        payload[field.name] = numeric(value);
        break;
      case "decimal":
        payload[field.name] = value === "" || value === null || value === undefined ? null : String(value);
        break;
      case "datetime":
        payload[field.name] = value ? new Date(String(value)).toISOString() : null;
        break;
      case "date":
        payload[field.name] = value || null;
        break;
      case "password":
        if (value) payload[field.name] = value;
        break;
      case "inline":
        payload[field.name] = Array.isArray(value) ? value.map((item) => buildPayload(field.fields, item as FormValues)) : [];
        break;
      default:
        payload[field.name] = value ?? "";
    }
  }
  return payload;
}

function isBlank(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === "string" && value.trim() === "") || (Array.isArray(value) && value.length === 0);
}

export function validateValues(fields: FieldConfig[], values: FormValues, prefix = "", isCreate = true): FormErrors {
  const errors: FormErrors = {};
  for (const field of fields) {
    if (field.translated) {
      const filled = LANGUAGES.some((code) => !isBlank(translationOf(values, code, field.name)));
      if (field.required && !filled) errors[`${prefix}translations.${ADMIN_LANGUAGE}.${field.name}`] = "Заполните хотя бы на одном языке";
      if ("maxLength" in field && field.maxLength) {
        for (const code of LANGUAGES) {
          if (translationOf(values, code, field.name).length > field.maxLength) {
            errors[`${prefix}translations.${code}.${field.name}`] = `Не более ${field.maxLength} символов`;
          }
        }
      }
      continue;
    }
    const value = values[field.name];
    const key = `${prefix}${field.name}`;
    if (field.type === "password" && field.required && isCreate && isBlank(value)) {
      errors[key] = "Задайте пароль";
      continue;
    }
    if (field.required && field.type !== "boolean" && field.type !== "password" && isBlank(value)) {
      errors[key] = "Обязательное поле";
      continue;
    }
    if (isBlank(value)) continue;
    if (field.type === "email" && !EMAIL_PATTERN.test(String(value))) errors[key] = "Некорректный email";
    if (field.type === "url" && !URL_PATTERN.test(String(value))) errors[key] = "Ссылка должна начинаться с https:// или /";
    if (field.type === "slug" && !SLUG_PATTERN.test(String(value))) errors[key] = "Только латиница в нижнем регистре, цифры и дефисы";
    if (field.type === "color" && !COLOR_PATTERN.test(String(value))) errors[key] = "Цвет в формате #1f6f78";
    if ((field.type === "number" || field.type === "decimal" || field.type === "range") && value !== "") {
      const number = Number(value);
      if (!Number.isFinite(number)) errors[key] = "Введите число";
      else if (field.min !== undefined && number < field.min) errors[key] = `Не меньше ${field.min}`;
      else if (field.max !== undefined && number > field.max) errors[key] = `Не больше ${field.max}`;
    }
    if ("maxLength" in field && field.maxLength && String(value).length > field.maxLength) errors[key] = `Не более ${field.maxLength} символов`;
    if (field.type === "password" && String(value).length < 10) errors[key] = "Минимум 10 символов";
    if (field.type === "inline" && Array.isArray(value)) {
      value.forEach((item, index) => Object.assign(errors, validateValues(field.fields, item as FormValues, `${key}.${index}.`, isCreate)));
    }
  }
  return errors;
}

export function errorFor(errors: FormErrors, field: FieldConfig, language: Language, prefix = ""): string | undefined {
  return field.translated ? errors[`${prefix}translations.${language}.${field.name}`] : errors[`${prefix}${field.name}`];
}

export function missingLanguageCount(fields: FieldConfig[], values: FormValues, language: Language): number {
  return fields.filter((field) => field.translated && field.required && isBlank(translationOf(values, language, field.name))).length;
}

export function languageHasErrors(errors: FormErrors, language: Language): boolean {
  return Object.keys(errors).some((key) => key.includes(`translations.${language}.`));
}

export function toDateTimeInput(value: unknown): string {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  const pad = (number: number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
