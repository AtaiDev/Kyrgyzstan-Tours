import { AnimatePresence, motion } from "framer-motion";
import { Eye } from "lucide-react";
import { Suspense } from "react";
import { Outlet, ScrollRestoration, useLocation, useNavigation } from "react-router";

import { usePreviewFlag } from "@/api/queries";
import { PageLoader } from "@/components/ui/States";
import { useI18n } from "@/i18n/context";

import { Footer } from "./Footer";
import { Header } from "./Header";

function NavigationProgress() {
  const navigation = useNavigation();
  const active = navigation.state !== "idle";
  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          className="fixed inset-x-0 top-0 z-[70] h-0.5 origin-left bg-gradient-to-r from-glacier-400 to-sand-400"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 0.85, transition: { duration: 2.4, ease: "easeOut" } }}
          exit={{ scaleX: 1, opacity: 0, transition: { duration: 0.3 } }}
        />
      ) : null}
    </AnimatePresence>
  );
}

function PreviewBanner() {
  const preview = usePreviewFlag();
  const { t } = useI18n();
  if (!preview) return null;
  return (
    <div role="status" className="fixed inset-x-0 bottom-0 z-[80] flex items-center justify-center gap-2 bg-sand-400 px-4 py-2 text-sm font-semibold text-night-950">
      <Eye className="h-4 w-4" aria-hidden />
      {t("common.previewMode")}
    </div>
  );
}

export function PublicLayout() {
  const { t } = useI18n();
  const location = useLocation();
  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#main"
        className="fixed top-3 left-3 z-[90] -translate-y-24 rounded-full bg-sand-400 px-5 py-3 text-sm font-semibold text-night-950 transition focus:translate-y-0"
      >
        {t("nav.skipToContent")}
      </a>
      <NavigationProgress />
      <Header />
      <motion.main
        id="main"
        key={location.pathname}
        tabIndex={-1}
        className="flex-1 outline-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </motion.main>
      <Footer />
      <PreviewBanner />
      <ScrollRestoration getKey={(entry) => entry.pathname} />
    </div>
  );
}
