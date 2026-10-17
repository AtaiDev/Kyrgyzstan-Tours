import { Clock, Facebook, Instagram, Mail, MapPin, MessageCircle, Phone, Send, Youtube } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

import { useSite } from "@/api/queries";
import { Logo } from "@/components/brand/Logo";
import { LanguageSwitcher } from "@/components/navigation/LanguageSwitcher";
import { useI18n } from "@/i18n/context";

import { FOOTER_COMPANY, FOOTER_EXPLORE } from "./navigation";

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="mb-5 text-xs font-bold tracking-[0.24em] text-sand-300 uppercase">{title}</h2>
      {children}
    </div>
  );
}

export function Footer() {
  const { t, path } = useI18n();
  const { data: site } = useSite();
  const contacts = site?.contacts;
  const year = new Date().getFullYear();
  const socials = [
    { href: contacts?.instagram_url, icon: Instagram, label: "Instagram" },
    { href: contacts?.facebook_url, icon: Facebook, label: "Facebook" },
    { href: contacts?.youtube_url, icon: Youtube, label: "YouTube" },
  ].filter((item) => item.href);

  return (
    <footer className="dark-surface relative overflow-hidden bg-night-950 text-milk-100">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-glacier-700/10 blur-3xl" aria-hidden />
      <div className="container-page relative grid grid-cols-1 gap-12 py-20 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
        <div className="space-y-6">
          <Link to={path("/")} className="inline-block rounded-lg">
            <Logo name={site?.site_name} logo={site?.logo} />
          </Link>
          {site?.tagline ? <p className="font-display text-2xl leading-snug text-milk-50">{site.tagline}</p> : null}
          {site?.footer_text ? <p className="max-w-sm text-sm leading-relaxed text-milk-200/70">{site.footer_text}</p> : null}
          {socials.length ? (
            <div className="flex gap-2">
              {socials.map(({ href, icon: SocialIcon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 transition hover:border-sand-400 hover:text-sand-300"
                >
                  <SocialIcon className="h-4 w-4" aria-hidden />
                </a>
              ))}
            </div>
          ) : null}
        </div>
        <FooterColumn title={t("footer.explore")}>
          <ul className="space-y-3 text-sm">
            {FOOTER_EXPLORE.map((item) => (
              <li key={item.to}>
                <Link to={path(item.to)} className="text-milk-200/80 transition hover:text-white">
                  {t(item.label)}
                </Link>
              </li>
            ))}
          </ul>
        </FooterColumn>
        <FooterColumn title={t("footer.company")}>
          <ul className="space-y-3 text-sm">
            {FOOTER_COMPANY.map((item) => (
              <li key={item.to}>
                <Link to={path(item.to)} className="text-milk-200/80 transition hover:text-white">
                  {t(item.label)}
                </Link>
              </li>
            ))}
          </ul>
        </FooterColumn>
        <FooterColumn title={t("footer.contacts")}>
          <ul className="space-y-3 text-sm text-milk-200/80">
            {contacts?.email ? (
              <li>
                <a href={`mailto:${contacts.email}`} className="inline-flex items-center gap-3 hover:text-white">
                  <Mail className="h-4 w-4 text-sand-300" aria-hidden />
                  {contacts.email}
                </a>
              </li>
            ) : null}
            {contacts?.phone ? (
              <li>
                <a href={`tel:${contacts.phone.replace(/\s+/g, "")}`} className="inline-flex items-center gap-3 hover:text-white">
                  <Phone className="h-4 w-4 text-sand-300" aria-hidden />
                  {contacts.phone}
                </a>
              </li>
            ) : null}
            {contacts?.whatsapp ? (
              <li>
                <a href={`https://wa.me/${contacts.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-3 hover:text-white">
                  <MessageCircle className="h-4 w-4 text-sand-300" aria-hidden />
                  WhatsApp
                </a>
              </li>
            ) : null}
            {contacts?.telegram ? (
              <li>
                <a href={`https://t.me/${contacts.telegram.replace(/^@/, "")}`} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-3 hover:text-white">
                  <Send className="h-4 w-4 text-sand-300" aria-hidden />
                  {contacts.telegram}
                </a>
              </li>
            ) : null}
            {site?.address ? (
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sand-300" aria-hidden />
                {site.address}
              </li>
            ) : null}
            {site?.working_hours ? (
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-sand-300" aria-hidden />
                {site.working_hours}
              </li>
            ) : null}
          </ul>
        </FooterColumn>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-5 py-7 text-xs text-milk-200/60 lg:flex-row lg:items-center lg:justify-between">
          <p>
            © {year} {site?.copyright ?? site?.site_name}
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            <li>
              <Link to={path("/privacy")} className="hover:text-white">
                {t("footer.privacy")}
              </Link>
            </li>
            <li>
              <Link to={path("/terms")} className="hover:text-white">
                {t("footer.terms")}
              </Link>
            </li>
            <li>
              <Link to={path("/credits")} className="hover:text-white">
                {t("footer.credits")}
              </Link>
            </li>
          </ul>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}
