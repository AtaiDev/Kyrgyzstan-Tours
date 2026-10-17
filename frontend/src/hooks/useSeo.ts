import { useEffect } from "react";
import { useLocation } from "react-router";

import { useSite } from "@/api/queries";
import { useI18n } from "@/i18n/context";
import { LANGUAGE_META, LANGUAGES, stripLanguagePrefix, withLanguage } from "@/i18n/languages";

export interface SeoOptions {
  title?: string;
  description?: string;
  image?: string | null;
  pageKey?: string;
  noIndex?: boolean;
  type?: "website" | "article";
}

const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") || "";

function absolute(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL || window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
}

function setMeta(attribute: "name" | "property", key: string, content: string | null) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!content) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function setLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]:not([hreflang])`;
  let element = document.head.querySelector<HTMLLinkElement>(selector);
  if (!element) {
    element = document.createElement("link");
    element.rel = rel;
    if (hreflang) element.hreflang = hreflang;
    document.head.appendChild(element);
  }
  element.href = href;
}

export function useSeo(options: SeoOptions) {
  const { language } = useI18n();
  const location = useLocation();
  const { data: site } = useSite();
  const pageSeo = options.pageKey ? site?.seo?.[options.pageKey] : undefined;
  const siteName = site?.site_name ?? "Kyrgyzstan-Tours";
  const baseTitle = options.title || pageSeo?.title || siteName;
  const title = baseTitle.includes(siteName) ? baseTitle : `${baseTitle} — ${siteName}`;
  const description = options.description || pageSeo?.description || site?.tagline || "";
  const image = options.image || pageSeo?.og_image?.url || site?.default_og_image?.url || "/og-image.jpg";
  const noIndex = Boolean(options.noIndex || pageSeo?.no_index);
  const type = options.type ?? "website";

  useEffect(() => {
    const path = stripLanguagePrefix(location.pathname);
    document.title = title;
    setMeta("name", "description", description.slice(0, 300));
    setMeta("name", "robots", noIndex ? "noindex, nofollow" : null);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description.slice(0, 300));
    setMeta("property", "og:type", type);
    setMeta("property", "og:url", absolute(location.pathname));
    setMeta("property", "og:image", absolute(image));
    setMeta("property", "og:locale", LANGUAGE_META[language].locale.replace("-", "_"));
    setMeta("property", "og:site_name", siteName);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description.slice(0, 300));
    setMeta("name", "twitter:image", absolute(image));
    setLink("canonical", absolute(location.pathname));
    for (const code of LANGUAGES) {
      setLink("alternate", absolute(withLanguage(code, path)), LANGUAGE_META[code].hreflang);
    }
    setLink("alternate", absolute(withLanguage("en", path)), "x-default");
  }, [title, description, image, noIndex, type, language, location.pathname, siteName]);
}
