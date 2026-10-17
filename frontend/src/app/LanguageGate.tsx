import { Navigate, Outlet, useLocation, useParams } from "react-router";

import { I18nProvider } from "@/i18n/I18nProvider";
import { detectPreferredLanguage, isLanguage } from "@/i18n/languages";

export function LanguageGate() {
  const { lang } = useParams();
  const location = useLocation();
  if (!isLanguage(lang)) {
    const isKyrgyzAlias = lang?.toLowerCase() === "kg";
    const pathname = isKyrgyzAlias ? location.pathname.replace(/^\/[^/]+/, "") : location.pathname;
    const target = `/${isKyrgyzAlias ? "ky" : detectPreferredLanguage()}${pathname}${location.search}${location.hash}`;
    return <Navigate to={target} replace />;
  }
  return (
    <I18nProvider language={lang}>
      <Outlet />
    </I18nProvider>
  );
}

export function RootRedirect() {
  const location = useLocation();
  return <Navigate to={`/${detectPreferredLanguage()}${location.search}`} replace />;
}
