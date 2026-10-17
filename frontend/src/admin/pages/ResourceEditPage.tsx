import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import { useCallback } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";

import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/States";

import { adminApi } from "../api";
import { useAdminAuth } from "../auth";
import { ResourceForm } from "../form/ResourceForm";
import { useEditableRecord } from "../form/useEditableRecord";
import { previewUrl } from "../resources/preview";
import { RESOURCE_MAP } from "../resources/registry";
import type { ResourceConfig } from "../resources/types";
import type { AdminRecord } from "../types";
import { useFeedback } from "../ui/feedback";
import { DemoBadge, PageHeader, TranslationBadges } from "../ui/Primitives";
import { AdminNotFound } from "./AdminNotFound";

function EditForm({ config, record }: { config: ResourceConfig; record: AdminRecord | null }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const { canModel } = useAdminAuth();
  const { notify, notifyError, confirm } = useFeedback();
  const isCreate = record === null;
  const canSave = isCreate ? canModel(config.model, "add") : canModel(config.model, "change");
  const canDelete = !isCreate && canModel(config.model, "delete") && config.allowDelete !== false;
  const fixed = Object.fromEntries((config.fixedParams ?? []).map((key) => [key, params.get(key) ?? ""]).filter(([, value]) => value));
  const listHref = `/admin/r/${config.key}${Object.keys(fixed).length ? `?${new URLSearchParams(fixed as Record<string, string>).toString()}` : ""}`;

  const save = useCallback(
    (payload: Record<string, unknown>) => (isCreate ? adminApi.create(config.endpoint, { ...fixed, ...payload }) : adminApi.update(config.endpoint, Number(record.id), payload)),
    [isCreate, config.endpoint, record, fixed],
  );

  const form = useEditableRecord({
    sections: config.sections,
    initial: record,
    defaults: config.createDefaults,
    save,
    onSaved: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "list", config.key] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "choices"] });
      queryClient.setQueryData(["admin", "record", config.key, String(saved.id)], saved);
      notify("success", isCreate ? "Запись создана" : "Изменения сохранены", "Обновления уже доступны на сайте.");
      if (isCreate) navigate(`/admin/r/${config.key}/${saved.id}${Object.keys(fixed).length ? `?${new URLSearchParams(fixed as Record<string, string>).toString()}` : ""}`, { replace: true });
    },
  });

  const remove = async () => {
    if (!record) return;
    const ok = await confirm({ title: `Удалить ${config.singular}?`, message: `«${record.display_name ?? record.id}» будет удалена без возможности восстановления.`, confirmLabel: "Удалить", danger: true });
    if (!ok) return;
    try {
      await adminApi.remove(config.endpoint, Number(record.id));
      notify("success", "Запись удалена");
      void queryClient.invalidateQueries({ queryKey: ["admin", "list", config.key] });
      navigate(listHref, { replace: true });
    } catch (error) {
      notifyError(error);
    }
  };

  const preview = record ? previewUrl(config, record) : null;

  return (
    <div>
      <PageHeader
        eyebrow={
          <Link to={listHref} className="inline-flex items-center gap-1.5 hover:text-night-900">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {config.title}
          </Link>
        }
        title={isCreate ? `Новая запись: ${config.singular}` : String(record.display_name || `${config.singular} #${record.id}`)}
        description={
          record ? (
            <span className="flex flex-wrap items-center gap-3">
              {config.translated ? <TranslationBadges missing={record.missing_translations} /> : null}
              {record.is_demo ? <DemoBadge /> : null}
              {record.updated_at ? <span>Изменено: {new Date(String(record.updated_at)).toLocaleString("ru-RU")}</span> : null}
            </span>
          ) : (
            "Заполните поля и сохраните запись. Переведённые поля заполняются на вкладках RU, EN и KG."
          )
        }
        actions={
          <>
            {preview ? (
              <a href={preview} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full border border-night-900/20 px-5 text-sm font-semibold text-night-900 hover:bg-night-900/5">
                <ExternalLink className="h-4 w-4" aria-hidden />
                Предпросмотр
              </a>
            ) : null}
            {canDelete ? (
              <Button variant="ghost" className="text-danger-600 hover:bg-danger-100" icon={<Trash2 className="h-4 w-4" aria-hidden />} onClick={() => void remove()}>
                Удалить
              </Button>
            ) : null}
          </>
        }
      />
      {!canSave ? <p className="mb-4 rounded-xl bg-warning-100 px-4 py-3 text-sm text-warning-700">У вашей роли есть только просмотр этого раздела.</p> : null}
      <ResourceForm
        sections={config.sections}
        values={form.values}
        onChange={form.setValues}
        errors={form.errors}
        generalError={form.generalError}
        onSubmit={() => void form.submit()}
        saving={form.saving}
        dirty={form.dirty}
        isNew={isCreate}
        readOnly={!canSave}
        submitLabel={isCreate ? "Создать" : "Сохранить"}
      />
    </div>
  );
}

function ExistingRecord({ config, id }: { config: ResourceConfig; id: string }) {
  const query = useQuery({ queryKey: ["admin", "record", config.key, id], queryFn: () => adminApi.get(config.endpoint, id), staleTime: 0 });
  if (query.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner label="Загрузка записи…" />
      </div>
    );
  }
  if (query.error instanceof ApiError && query.error.status === 404) return <AdminNotFound />;
  if (query.isError || !query.data) {
    return (
      <div className="rounded-2xl border border-danger-600/30 bg-danger-100 p-6 text-danger-600">
        Не удалось загрузить запись. <button type="button" className="underline" onClick={() => void query.refetch()}>Повторить</button>
      </div>
    );
  }
  return <EditForm key={`${query.data.id}-${String(query.data.updated_at ?? "")}`} config={config} record={query.data} />;
}

export default function ResourceEditPage() {
  const { resource = "", id } = useParams();
  const { canModel } = useAdminAuth();
  const config = RESOURCE_MAP[resource];
  if (!config) return <AdminNotFound />;
  if (!canModel(config.model, "view")) return <AdminNotFound forbidden />;
  if (!id) {
    if (config.allowCreate === false || !canModel(config.model, "add")) return <AdminNotFound forbidden />;
    return <EditForm config={config} record={null} />;
  }
  return <ExistingRecord config={config} id={id} />;
}
