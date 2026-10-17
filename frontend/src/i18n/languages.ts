export const LANGUAGES = ["ru", "en", "ky"] as const;

export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = "en";

export const LANGUAGE_META: Record<Language, { short: string; native: string; locale: string; hreflang: string }> = {
  ru: { short: "RU", native: "Русский", locale: "ru-RU", hreflang: "ru" },
  en: { short: "EN", native: "English", locale: "en-GB", hreflang: "en" },
  ky: { short: "KG", native: "Кыргызча", locale: "ky-KG", hreflang: "ky" },
};

const STORAGE_KEY = "kt-language";

export function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && (LANGUAGES as readonly string[]).includes(value);
}

export function rememberLanguage(language: Language) {
  try {
    window.localStorage.setItem(STORAGE_KEY, language);
  } catch {
    return;
  }
}

function storedLanguage(): Language | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return isLanguage(value) ? value : null;
  } catch {
    return null;
  }
}

export function detectPreferredLanguage(fallback: Language = DEFAULT_LANGUAGE): Language {
  const stored = storedLanguage();
  if (stored) return stored;
  for (const candidate of navigator.languages ?? [navigator.language]) {
    const code = candidate.toLowerCase().split("-")[0];
    if (code === "kg") return "ky";
    if (isLanguage(code)) return code;
  }
  return fallback;
}

export function stripLanguagePrefix(pathname: string): string {
  const [, first, ...rest] = pathname.split("/");
  if (isLanguage(first)) return `/${rest.join("/")}`.replace(/\/+$/, "") || "/";
  return pathname || "/";
}

export function withLanguage(language: Language, path: string): string {
  if (/^(https?:|mailto:|tel:)/.test(path)) return path;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return clean === "/" ? `/${language}` : `/${language}${clean}`;
}
