import { ArrowLeft } from "lucide-react";

import { useSite } from "@/api/queries";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { LinkButton } from "@/components/ui/Button";
import { useSeo } from "@/hooks/useSeo";
import { useI18n } from "@/i18n/context";

export default function NotFoundPage() {
  const { t, path } = useI18n();
  const { data: site } = useSite();
  useSeo({ title: t("common.notFoundTitle"), noIndex: true });
  return (
    <section className="dark-surface relative isolate flex min-h-[100svh] items-center overflow-hidden bg-night-950 text-milk-50">
      <ResponsiveImage media={site?.default_og_image} sizes="100vw" className="absolute inset-0 -z-20 h-full w-full opacity-40" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night-950 via-night-950/70 to-night-950/40" aria-hidden />
      <div className="container-page pt-24">
        <p className="font-display text-[clamp(6rem,20vw,14rem)] leading-none font-semibold text-sand-300/80">404</p>
        <h1 className="display-lg mt-2">{t("common.notFoundTitle")}</h1>
        <p className="mt-5 max-w-xl text-lg text-milk-100/80">{t("common.notFoundText")}</p>
        <LinkButton to={path("/")} variant="accent" size="lg" className="mt-10" icon={<ArrowLeft className="h-4 w-4" aria-hidden />}>
          {t("common.goHome")}
        </LinkButton>
      </div>
    </section>
  );
}
