import { LANGUAGE_META, LANGUAGES } from "@/i18n/languages";
import type { Language } from "@/i18n/languages";
import { cn } from "@/utils/cn";

interface LanguageTabsProps {
  active: Language;
  onChange: (language: Language) => void;
  missing: Record<Language, number>;
  errors: Record<Language, boolean>;
}

export function LanguageTabs({ active, onChange, missing, errors }: LanguageTabsProps) {
  return (
    <div role="tablist" aria-label="Язык перевода" className="inline-flex rounded-full border border-graphite-200 bg-white p-1">
      {LANGUAGES.map((code) => (
        <button
          key={code}
          type="button"
          role="tab"
          aria-selected={active === code}
          onClick={() => onChange(code)}
          className={cn(
            "relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold tracking-wide transition",
            active === code ? "bg-night-900 text-milk-50" : "text-graphite-600 hover:text-night-900",
          )}
        >
          {LANGUAGE_META[code].short}
          {errors[code] ? (
            <span className="h-2 w-2 rounded-full bg-danger-600" aria-label="Есть ошибки" />
          ) : missing[code] ? (
            <span className={cn("rounded-full px-1.5 text-[0.62rem]", active === code ? "bg-white/20" : "bg-warning-100 text-warning-700")} title="Незаполненные обязательные поля">
              {missing[code]}
            </span>
          ) : (
            <span className={cn("text-[0.7rem]", active === code ? "text-glacier-300" : "text-success-700")} aria-label="Перевод заполнен">
              ✓
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
