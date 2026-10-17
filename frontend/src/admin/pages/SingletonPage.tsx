import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { Spinner } from "@/components/ui/States";

import { adminApi } from "../api";
import { useAdminAuth } from "../auth";
import { ResourceForm } from "../form/ResourceForm";
import { useEditableRecord } from "../form/useEditableRecord";
import type { SingletonConfig } from "../resources/singletons";
import type { AdminRecord } from "../types";
import { useFeedback } from "../ui/feedback";
import { PageHeader } from "../ui/Primitives";
import { AdminNotFound } from "./AdminNotFound";

function SingletonForm({ config, record, footer }: { config: SingletonConfig; record: AdminRecord; footer?: ReactNode }) {
  const { canModel } = useAdminAuth();
  const { notify } = useFeedback();
  const queryClient = useQueryClient();
  const canSave = canModel(config.model, "change");
  const form = useEditableRecord({
    sections: config.sections,
    initial: record,
    save: (payload) => adminApi.saveSingleton(config.endpoint, payload),
    onSaved: (saved) => {
      queryClient.setQueryData(["admin", "singleton", config.endpoint], saved);
      void queryClient.invalidateQueries({ queryKey: ["site"] });
      notify("success", "Настройки сохранены");
    },
  });
  return (
    <>
      <ResourceForm
        sections={config.sections}
        values={form.values}
        onChange={form.setValues}
        errors={form.errors}
        generalError={form.generalError}
        onSubmit={() => void form.submit()}
        saving={form.saving}
        dirty={form.dirty}
        readOnly={!canSave}
      />
      {footer}
    </>
  );
}

export function SingletonPage({ config, footer }: { config: SingletonConfig; footer?: ReactNode }) {
  const { canModel } = useAdminAuth();
  const query = useQuery({ queryKey: ["admin", "singleton", config.endpoint], queryFn: () => adminApi.singleton(config.endpoint), enabled: canModel(config.model, "view") });
  if (!canModel(config.model, "view")) return <AdminNotFound forbidden />;
  return (
    <div>
      <PageHeader title={config.title} description={config.description} />
      {query.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner label="Загрузка…" />
        </div>
      ) : query.data ? (
        <SingletonForm key={String(query.data.updated_at ?? "")} config={config} record={query.data} footer={footer} />
      ) : (
        <p className="rounded-xl bg-danger-100 p-4 text-danger-600">Не удалось загрузить настройки.</p>
      )}
    </div>
  );
}
