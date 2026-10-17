import { useSite, useStaticPage } from "@/api/queries";
import { PageHero } from "@/components/layout/PageHero";
import { Markdown } from "@/components/ui/Markdown";
import { ErrorState, PageLoader } from "@/components/ui/States";
import { useSeo } from "@/hooks/useSeo";
import { useI18n } from "@/i18n/context";

export function LegalPage({ slug }: { slug: "privacy" | "terms" }) {
  const { formatDate } = useI18n();
  const { data: site } = useSite();
  const { data, isLoading, isError, refetch } = useStaticPage(slug);
  useSeo({ title: data?.seo_title || data?.title, description: data?.seo_description });
  if (isLoading) return <PageLoader />;
  if (isError || !data) {
    return (
      <div className="py-40">
        <ErrorState onRetry={() => void refetch()} />
      </div>
    );
  }
  return (
    <>
      <PageHero title={data.title} image={site?.default_og_image} crumbs={[{ label: data.title }]} />
      <section className="bg-milk-50 py-16 sm:py-20">
        <div className="container-page max-w-3xl">
          <p className="mb-8 text-sm text-graphite-500">{formatDate(data.updated_at)}</p>
          <Markdown>{data.body}</Markdown>
        </div>
      </section>
    </>
  );
}
