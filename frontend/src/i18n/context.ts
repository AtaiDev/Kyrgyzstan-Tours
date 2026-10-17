import { createContext, useContext } from "react";

import type { Language } from "./languages";
import type { Translator } from "./translate";

export interface I18nContextValue extends Translator {
  language: Language;
  locale: string;
  path: (target: string) => string;
  formatNumber: (value: number) => string;
  formatPrice: (amount: string | number, currency: string) => string;
  formatDate: (value: string | Date, options?: Intl.DateTimeFormatOptions) => string;
  formatMonth: (month: number) => string;
  languageName: (code: string) => string;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

export function useI18n(): I18nContextValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}
