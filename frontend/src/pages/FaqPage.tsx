import { Plus } from "lucide-react";
import { useState } from "react";

import { useFaq, useSite } from "@/api/queries";
import { PageHero } from "@/components/layout/PageHero";
import { LinkButton } from "@/components/ui/Button";
import { ErrorState, Skeleton } from "@/components/ui/States";
import { useSeo } from "@/hooks/useSeo";
import { useI18n } from "@/i18n/context";
import type { MessageKey } from "@/i18n/types";
import { cn } from "@/utils/cn";

export default function FaqPage() {
  const { t, path } = useI18n();
  const { data: items = [], isLoading, isError, refetch } = useFaq();
  const { data: site } = useSite();
  const [open, setOpen] = useState<number | null>(null);
  useSeo({ pageKey: "faq", title: t("page.faqTitle") });
  const categories = [...new Set(items.map((item) => item.category))];

  return (
    <>
      <PageHero title={t("page.faqTitle")} subtitle={t("page.faqSubtitle")} image={site?.default_og_image} crumbs={[{ label: t("nav.faq") }]} />
      <section className="bg-milk-100 py-16 sm:py-20">
        <div className="container-page max-w-4xl">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-20 w-full" />
              ))}
            </div>
          ) : isError ? (
            <ErrorState onRetry={() => void refetch()} />
          ) : (
            categories.map((category) => (
              <div key={category} className="mb-12">
                <h2 className="mb-5 text-xs font-bold tracking-[0.24em] text-glacier-700 uppercase">{t(`faq.${category}` as MessageKey)}</h2>
                <div className="divide-y divide-graphite-200 rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-soft)]">
                  {items
                    .filter((item) => item.category === category)
                    .map((item) => {
                      const expanded = open === item.id;
                      return (
                        <div key={item.id}>
                          <h3>
                            <button
                              type="button"
                              aria-expanded={expanded}
                              aria-controls={`faq-${item.id}`}
                              onClick={() => setOpen(expanded ? null : item.id)}
                              className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left font-display text-xl font-semibold text-night-900 sm:text-2xl"
                            >
                              {item.question}
                              <Plus className={cn("h-5 w-5 shrink-0 transition", expanded && "rotate-45")} aria-hidden />
                            </button>
                          </h3>
                          <div id={`faq-${item.id}`} hidden={!expanded} className="px-6 pb-6 leading-relaxed text-graphite-700">
                            {item.answer}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))
          )}
          <div className="mt-6 text-center">
            <LinkButton to={path("/contact")}>{t("contact.writeUs")}</LinkButton>
          </div>
        </div>
      </section>
    </>
  );
}
