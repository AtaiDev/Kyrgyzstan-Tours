import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useSearchParams } from "react-router";

import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { CardSkeletonGrid, EmptyState, ErrorState } from "@/components/ui/States";
import { useI18n } from "@/i18n/context";
import type { Paginated } from "@/types/api";
import { cn } from "@/utils/cn";
import { updateSearch } from "@/utils/query";

interface CatalogResultsProps<T> {
  query: UseQueryResult<Paginated<T>>;
  render: (item: T, index: number) => ReactNode;
  className?: string;
  skeletonCount?: number;
}

export function CatalogResults<T>({ query, render, className, skeletonCount = 6 }: CatalogResultsProps<T>) {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  if (query.isLoading) return <CardSkeletonGrid count={skeletonCount} className={className} />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => void query.refetch()} />;
  if (query.data.results.length === 0) {
    return (
      <EmptyState
        title={t("common.noResults")}
        text={t("common.noResultsText")}
        action={
          <Button variant="outline" onClick={() => setParams(new URLSearchParams())}>
            {t("common.clearFilters")}
          </Button>
        }
      />
    );
  }
  return (
    <>
      <div className={cn("grid grid-cols-1 gap-6 transition-opacity sm:grid-cols-2 lg:grid-cols-3", query.isFetching && "opacity-60", className)}>
        {query.data.results.map((item, index) => render(item, index))}
      </div>
      <Pagination
        page={query.data.page}
        totalPages={query.data.total_pages}
        onChange={(page) => {
          setParams(updateSearch(params, { page: String(page) }));
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </>
  );
}
