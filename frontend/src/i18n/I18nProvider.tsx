import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";

import { publicApi } from "@/api/public";

import { I18nContext } from "./context";
import type { I18nContextValue } from "./context";
import { dictionaries, en } from "./dictionaries";
import type { Language } from "./languages";
import { LANGUAGE_META, rememberLanguage, withLanguage } from "./languages";
import { createTranslator } from "./translate";

export function I18nProvider({ language, children, persist = true }: { language: Language; children: ReactNode; persist?: boolean }) {
  const overrides = useQuery({
    queryKey: ["interface-strings", language],
    queryFn: ({ signal }) => publicApi.interfaceStrings(language, signal),
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    document.documentElement.lang = language;
    if (persist) rememberLanguage(language);
  }, [language, persist]);

  const value = useMemo<I18nContextValue>(() => {
    const locale = LANGUAGE_META[language].locale;
    const translator = createTranslator(language, dictionaries[language], en, overrides.data?.strings);
    const numberFormat = new Intl.NumberFormat(locale);
    const displayNames = safeDisplayNames(locale);
    return {
      language,
      locale,
      ...translator,
      path: (target: string) => withLanguage(language, target),
      formatNumber: (value: number) => numberFormat.format(value),
      formatPrice: (amount: string | number, currency: string) => {
        const numeric = typeof amount === "string" ? Number(amount) : amount;
        try {
          return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(numeric);
        } catch {
          return `${numberFormat.format(numeric)} ${currency}`;
        }
      },
      formatDate: (value: string | Date, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) =>
        new Intl.DateTimeFormat(locale, options).format(typeof value === "string" ? new Date(value) : value),
      formatMonth: (month: number) => new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date(2024, month - 1, 15)),
      languageName: (code: string) => displayNames?.of(code) ?? code.toUpperCase(),
    };
  }, [language, overrides.data]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

function safeDisplayNames(locale: string) {
  try {
    return new Intl.DisplayNames([locale, "en"], { type: "language" });
  } catch {
    return null;
  }
}
