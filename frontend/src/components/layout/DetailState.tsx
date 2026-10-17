import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { ApiError } from "@/api/client";
import { ErrorState, Spinner } from "@/components/ui/States";
import { useI18n } from "@/i18n/context";
import NotFoundPage from "@/pages/NotFoundPage";

export function DetailState<T>({ query, children }: { query: UseQueryResult<T>; children: (data: T) => ReactNode }) {
  const { t } = useI18n();
  if (query.isLoading) {
    return (
      <div className="dark-surface flex min-h-[70svh] items-center justify-center bg-night-950 text-milk-100">
        <Spinner label={t("common.loading")} />
      </div>
    );
  }
  if (query.error instanceof ApiError && query.error.status === 404) return <NotFoundPage />;
  if (query.isError || !query.data) {
    return (
      <div className="dark-surface flex min-h-[70svh] items-center justify-center bg-night-950 px-4 pt-24">
        <ErrorState tone="dark" onRetry={() => void query.refetch()} />
      </div>
    );
  }
  return <>{children(query.data)}</>;
}
