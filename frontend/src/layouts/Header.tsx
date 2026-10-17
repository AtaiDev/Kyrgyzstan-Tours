import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router";

import { useSite } from "@/api/queries";
import { Logo } from "@/components/brand/Logo";
import { LanguageSwitcher } from "@/components/navigation/LanguageSwitcher";
import { buttonClasses } from "@/components/ui/Button";
import { useI18n } from "@/i18n/context";
import { cn } from "@/utils/cn";

import { MobileMenu } from "./MobileMenu";
import { MAIN_NAVIGATION } from "./navigation";

export function Header() {
  const { t, path } = useI18n();
  const { data: site } = useSite();
  const { scrollY } = useScroll();
  const [solid, setSolid] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    setSolid(latest > 40);
    setHidden(latest > 480 && latest > previous && !menuOpen);
  });

  return (
    <>
      <motion.header
        initial={false}
        animate={{ y: hidden ? "-110%" : "0%" }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "dark-surface fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow] duration-500",
          solid ? "bg-night-950 shadow-[0_10px_30px_-20px_rgb(0_0_0/0.6)]" : "bg-gradient-to-b from-night-950/50 to-transparent",
        )}
      >
        <div className="container-page flex h-20 items-center justify-between gap-6">
          <Link to={path("/")} className="rounded-lg" aria-label={site?.site_name ?? "Kyrgyzstan-Tours"}>
            <Logo name={site?.site_name} logo={site?.logo} />
          </Link>
          <nav aria-label={t("nav.mainNavigation")} className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {MAIN_NAVIGATION.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={path(item.to)}
                    className={({ isActive }) =>
                      cn(
                        "relative rounded-full px-4 py-2 text-sm font-semibold tracking-wide text-milk-100/85 transition hover:text-white",
                        isActive && "text-white after:absolute after:inset-x-4 after:-bottom-0.5 after:h-px after:bg-sand-400",
                      )
                    }
                  >
                    {t(item.label)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSwitcher className="max-md:hidden" showIcon={false} />
            <Link to={path("/contact")} className={buttonClasses("accent", "sm", "max-sm:hidden lg:max-xl:hidden")}>
              {t("nav.planTrip")}
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={t("a11y.openMenu")}
              aria-expanded={menuOpen}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10 lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
      </motion.header>
      <AnimatePresence>{menuOpen ? <MobileMenu onClose={() => setMenuOpen(false)} /> : null}</AnimatePresence>
    </>
  );
}
