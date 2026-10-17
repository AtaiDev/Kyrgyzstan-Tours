import { motion } from "framer-motion";
import { Mail, Phone, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router";

import { useSite } from "@/api/queries";
import { Logo } from "@/components/brand/Logo";
import { LanguageSwitcher } from "@/components/navigation/LanguageSwitcher";
import { useI18n } from "@/i18n/context";
import { cn } from "@/utils/cn";

import { MAIN_NAVIGATION } from "./navigation";

export function MobileMenu({ onClose }: { onClose: () => void }) {
  const { t, path } = useI18n();
  const { data: site } = useSite();
  const location = useLocation();
  const closeRef = useRef<HTMLButtonElement>(null);
  const initialPath = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname !== initialPath.current) onClose();
  }, [location.pathname, onClose]);

  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const links = [...MAIN_NAVIGATION, { to: "/reviews", label: "nav.reviews" as const }, { to: "/contact", label: "nav.contact" as const }];

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={t("nav.menu")}
      className="dark-surface fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-night-950 text-milk-50"
      initial={{ clipPath: "circle(0% at 100% 0%)" }}
      animate={{ clipPath: "circle(150% at 100% 0%)" }}
      exit={{ clipPath: "circle(0% at 100% 0%)" }}
      transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
    >
      <div className="container-page flex h-20 shrink-0 items-center justify-between">
        <Logo name={site?.site_name} logo={site?.logo} />
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={t("a11y.closeMenu")}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 hover:bg-white/10"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>
      <nav aria-label={t("nav.mainNavigation")} className="container-page flex-1 py-8">
        <ul className="space-y-1">
          {links.map((item, index) => (
            <motion.li
              key={item.to}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + index * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <NavLink
                to={path(item.to)}
                className={({ isActive }) =>
                  cn("block py-2 font-display text-4xl font-semibold transition sm:text-5xl", isActive ? "text-sand-300" : "text-milk-50 hover:text-sand-200")
                }
              >
                {t(item.label)}
              </NavLink>
            </motion.li>
          ))}
        </ul>
      </nav>
      <div className="container-page space-y-6 border-t border-white/10 py-8">
        <LanguageSwitcher />
        <div className="flex flex-col gap-3 text-sm text-milk-200/80">
          {site?.contacts.email ? (
            <a href={`mailto:${site.contacts.email}`} className="inline-flex items-center gap-2 hover:text-white">
              <Mail className="h-4 w-4" aria-hidden />
              {site.contacts.email}
            </a>
          ) : null}
          {site?.contacts.phone ? (
            <a href={`tel:${site.contacts.phone.replace(/\s+/g, "")}`} className="inline-flex items-center gap-2 hover:text-white">
              <Phone className="h-4 w-4" aria-hidden />
              {site.contacts.phone}
            </a>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
