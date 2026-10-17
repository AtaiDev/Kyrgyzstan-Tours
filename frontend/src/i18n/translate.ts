import type { Language } from "./languages";
import { LANGUAGE_META } from "./languages";
import type { Dictionary, MessageKey, PluralKey } from "./types";

export type TranslateVars = Record<string, string | number>;

export function interpolate(template: string, vars?: TranslateVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

export interface Translator {
  t: (key: MessageKey, vars?: TranslateVars) => string;
  plural: (key: PluralKey, count: number) => string;
}

export function createTranslator(
  language: Language,
  dictionary: Dictionary,
  fallback: Dictionary,
  overrides: Record<string, string> = {},
): Translator {
  const rules = new Intl.PluralRules(LANGUAGE_META[language].locale);
  const numbers = new Intl.NumberFormat(LANGUAGE_META[language].locale);
  return {
    t(key, vars) {
      const template = overrides[key] || dictionary.messages[key] || fallback.messages[key] || key;
      return interpolate(template, vars);
    },
    plural(key, count) {
      const forms = dictionary.plurals[key] ?? fallback.plurals[key];
      const category = rules.select(count);
      const template = forms[category] ?? forms.other;
      return interpolate(template, { count: numbers.format(count) });
    },
  };
}
