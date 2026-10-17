import { useSections } from "@/api/queries";
import { ErrorState, Spinner } from "@/components/ui/States";
import { HOME_SECTIONS } from "@/features/home/registry";
import { useSeo } from "@/hooks/useSeo";
import { useI18n } from "@/i18n/context";

export default function HomePage() {
  const { t } = useI18n();
  const { data, isLoading, isError, refetch } = useSections("home");
  useSeo({ pageKey: "home" });

  if (isLoading) {
    return (
      <div className="dark-surface flex min-h-[100svh] items-center justify-center bg-night-950 text-milk-100">
        <Spinner label={t("common.loading")} />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="dark-surface flex min-h-[100svh] items-center justify-center bg-night-950 px-4 pt-24">
        <ErrorState tone="dark" onRetry={() => void refetch()} />
      </div>
    );
  }

  return (
    <>
      {data.sections.map((section) => {
        const Component = HOME_SECTIONS[section.key];
        return Component ? <Component key={section.key} section={section} /> : null;
      })}
    </>
  );
}
