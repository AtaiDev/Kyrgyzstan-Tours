import { ExternalLink } from "lucide-react";
import { useState } from "react";

import { useCredits, useSite } from "@/api/queries";
import { PageHero } from "@/components/layout/PageHero";
import { Pagination } from "@/components/ui/Pagination";
import { CardSkeletonGrid, ErrorState } from "@/components/ui/States";
import { useSeo } from "@/hooks/useSeo";
import { useI18n } from "@/i18n/context";

function sourceName(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.endsWith("wikimedia.org")) return "Wikimedia Commons";
    if (host.endsWith("youtube.com") || host === "youtu.be") return "YouTube";
    return host;
  } catch {
    return url;
  }
}

export default function CreditsPage() {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const { data: site } = useSite();
  const { data, isLoading, isError, refetch } = useCredits(page);
  useSeo({ pageKey: "credits", title: t("page.creditsTitle") });

  return (
    <>
      <PageHero title={t("page.creditsTitle")} subtitle={t("page.creditsSubtitle")} image={site?.default_og_image} crumbs={[{ label: t("footer.credits") }]} />
      <section className="bg-milk-100 py-16 sm:py-20">
        <div className="container-page">
          <p className="mb-10 max-w-3xl text-sm text-graphite-600">{t("map.attribution")}</p>
          {isLoading ? (
            <CardSkeletonGrid count={8} className="lg:grid-cols-4" />
          ) : isError || !data ? (
            <ErrorState onRetry={() => void refetch()} />
          ) : (
            <>
              <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {data.results.map((media) => (
                  <li key={media.id} className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-soft)]">
                    {media.kind === "video" ? (
                      <video src={`${media.url}#t=1`} muted playsInline preload="metadata" aria-label={media.alt} className="aspect-[4/3] w-full bg-night-900 object-cover" />
                    ) : (
                      <img src={media.thumbnail_url} alt={media.alt} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                    )}
                    <div className="space-y-1 p-4 text-sm">
                      <p className="font-semibold text-night-900">{media.alt}</p>
                      <p className="text-graphite-600">{t(media.kind === "video" ? "common.videoBy" : "common.photoBy", { author: media.author })}</p>
                      <p className="text-graphite-500">
                        {media.license_url ? (
                          <a href={media.license_url} target="_blank" rel="noreferrer noopener" className="underline underline-offset-2 hover:text-night-900">
                            {t("common.license", { license: media.license })}
                          </a>
                        ) : (
                          t("common.license", { license: media.license })
                        )}
                      </p>
                      {media.source_url ? (
                        <a href={media.source_url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 font-semibold text-glacier-700 hover:text-glacier-800">
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                          {sourceName(media.source_url)}
                        </a>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
              <Pagination page={data.page} totalPages={data.total_pages} onChange={setPage} />
            </>
          )}
        </div>
      </section>
    </>
  );
}
