import { Globe } from "lucide-react";
import { Link, useLocation } from "react-router";

import { useI18n } from "@/i18n/context";
import { LANGUAGE_META, LANGUAGES, rememberLanguage, stripLanguagePrefix, withLanguage } from "@/i18n/languages";
import { cn } from "@/utils/cn";

export function LanguageSwitcher({ tone = "dark", className, showIcon = true }: { tone?: "light" | "dark"; className?: string; showIcon?: boolean }) {
  const { language, t } = useI18n();
  const location = useLocation();
  const path = stripLanguagePrefix(location.pathname);
  return (
    <nav aria-label={t("nav.language")} className={cn("flex items-center gap-1", className)}>
      {showIcon ? <Globe className={cn("mr-1 h-4 w-4", tone === "dark" ? "text-milk-200/70" : "text-graphite-500")} aria-hidden /> : null}
      {LANGUAGES.map((code) => {
        const active = code === language;
        return (
          <Link
            key={code}
            to={`${withLanguage(code, path)}${location.search}`}
            hrefLang={LANGUAGE_META[code].hreflang}
            lang={code}
            aria-current={active ? "true" : undefined}
            title={LANGUAGE_META[code].native}
            onClick={() => rememberLanguage(code)}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-bold tracking-[0.14em] transition",
              tone === "dark"
                ? active
                  ? "bg-milk-50 text-night-900"
                  : "text-milk-100/80 hover:bg-white/10 hover:text-white"
                : active
                  ? "bg-night-900 text-milk-50"
                  : "text-graphite-600 hover:bg-night-900/5 hover:text-night-900",
            )}
          >
            {LANGUAGE_META[code].short}
          </Link>
        );
      })}
    </nav>
  );
}
