import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Replace, Search, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { inputClasses } from "@/components/ui/Fields";
import { Spinner } from "@/components/ui/States";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { LANGUAGE_META, LANGUAGES } from "@/i18n/languages";
import { cn } from "@/utils/cn";

import { adminApi } from "../api";
import { useAdminAuth } from "../auth";
import type { MediaAsset, Translations } from "../types";
import { useFeedback } from "../ui/feedback";
import { DemoBadge, PageHeader, TranslationBadges } from "../ui/Primitives";
import { AdminNotFound } from "./AdminNotFound";

function formatSize(bytes: number) {
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
  return `${Math.round(bytes / 1024)} КБ`;
}

function AssetEditor({ asset, onClose }: { asset: MediaAsset; onClose: () => void }) {
  const { canModel } = useAdminAuth();
  const { notify, notifyError, confirm } = useFeedback();
  const queryClient = useQueryClient();
  const replaceInput = useRef<HTMLInputElement>(null);
  const [current, setCurrent] = useState(asset);
  const [translations, setTranslations] = useState<Translations>(() => Object.fromEntries(LANGUAGES.map((code) => [code, { alt: asset.translations[code]?.alt ?? "", caption: asset.translations[code]?.caption ?? "" }])));
  const [meta, setMeta] = useState({ author: asset.author, license: asset.license, license_url: asset.license_url, source_url: asset.source_url, folder: asset.folder });
  const [busy, setBusy] = useState(false);
  const canChange = canModel("media_library.mediaasset", "change");
  const canDelete = canModel("media_library.mediaasset", "delete");

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "media"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "media-picker"] });
  };

  const save = async () => {
    setBusy(true);
    try {
      const updated = await adminApi.updateMedia(current.id, { ...meta, translations });
      setCurrent(updated);
      notify("success", "Описание файла сохранено");
      refresh();
    } catch (error) {
      notifyError(error);
    } finally {
      setBusy(false);
    }
  };

  const replace = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const updated = await adminApi.replaceMedia(current.id, file);
      setCurrent(updated);
      notify("success", "Файл заменён", "Новое изображение уже используется во всех связанных записях.");
      refresh();
    } catch (error) {
      notifyError(error);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    const ok = await confirm({ title: "Удалить файл?", message: "Файл будет удалён с сервера. Если он используется в контенте, система не даст его удалить.", confirmLabel: "Удалить", danger: true });
    if (!ok) return;
    try {
      await adminApi.deleteMedia(current.id);
      notify("success", "Файл удалён");
      refresh();
      onClose();
    } catch (error) {
      notifyError(error);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <div className="overflow-hidden rounded-2xl bg-graphite-100">
          {current.kind === "video" ? <video src={current.url} controls className="w-full" /> : <img src={current.medium_url} alt={current.display_name} className="max-h-[60vh] w-full object-contain" />}
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <dt className="text-graphite-500">Файл</dt>
          <dd className="truncate text-graphite-800">{current.original_name}</dd>
          <dt className="text-graphite-500">Размер</dt>
          <dd className="text-graphite-800">
            {current.width ? `${current.width}×${current.height} · ` : ""}
            {formatSize(current.file_size)}
          </dd>
          <dt className="text-graphite-500">Ссылка</dt>
          <dd>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-glacier-700 hover:underline"
              onClick={() => void navigator.clipboard?.writeText(new URL(current.url, window.location.origin).toString()).then(() => notify("info", "Ссылка скопирована"))}
            >
              <Copy className="h-3.5 w-3.5" aria-hidden /> Копировать
            </button>
          </dd>
        </dl>
      </div>
      <div className="space-y-4">
        {LANGUAGES.map((code) => (
          <fieldset key={code} className="rounded-xl border border-graphite-200 p-3">
            <legend className="px-1 text-xs font-bold text-night-700">{LANGUAGE_META[code].short}</legend>
            <label className="block text-xs font-semibold text-graphite-700">
              Alt-текст (описание для незрячих и поисковиков)
              <input disabled={!canChange} value={translations[code]?.alt ?? ""} maxLength={255} onChange={(event) => setTranslations((value) => ({ ...value, [code]: { ...value[code], alt: event.target.value } }))} className={cn(inputClasses(), "mt-1 py-2")} />
            </label>
            <label className="mt-2 block text-xs font-semibold text-graphite-700">
              Подпись
              <input disabled={!canChange} value={translations[code]?.caption ?? ""} maxLength={300} onChange={(event) => setTranslations((value) => ({ ...value, [code]: { ...value[code], caption: event.target.value } }))} className={cn(inputClasses(), "mt-1 py-2")} />
            </label>
          </fieldset>
        ))}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(
            [
              ["author", "Автор"],
              ["license", "Лицензия"],
              ["license_url", "Ссылка на лицензию"],
              ["source_url", "Источник"],
              ["folder", "Папка"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-xs font-semibold text-graphite-700">
              {label}
              <input disabled={!canChange} value={meta[key]} onChange={(event) => setMeta((value) => ({ ...value, [key]: event.target.value }))} className={cn(inputClasses(), "mt-1 py-2")} />
            </label>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {canChange ? (
            <>
              <Button loading={busy} onClick={() => void save()}>
                Сохранить описание
              </Button>
              <input ref={replaceInput} type="file" className="hidden" accept={current.kind === "video" ? "video/mp4,video/webm" : "image/*"} onChange={(event) => void replace(event.target.files?.[0])} />
              <Button variant="outline" icon={<Replace className="h-4 w-4" aria-hidden />} onClick={() => replaceInput.current?.click()}>
                Заменить файл
              </Button>
            </>
          ) : null}
          {canDelete ? (
            <Button variant="ghost" className="text-danger-600 hover:bg-danger-100" icon={<Trash2 className="h-4 w-4" aria-hidden />} onClick={() => void remove()}>
              Удалить
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function MediaLibraryPage() {
  const { canModel } = useAdminAuth();
  const { notify, notifyError } = useFeedback();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("");
  const [folder, setFolder] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<MediaAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const debounced = useDebouncedValue(search, 300);
  const canView = canModel("media_library.mediaasset", "view");
  const canAdd = canModel("media_library.mediaasset", "add");

  const query = useQuery({
    queryKey: ["admin", "media", debounced, kind, folder, page],
    queryFn: () => adminApi.media({ search: debounced, kind, folder, page, page_size: 36 }),
    placeholderData: keepPreviousData,
    enabled: canView,
  });
  const folders = useQuery({ queryKey: ["admin", "media-folders"], queryFn: () => adminApi.mediaFolders(), enabled: canView });

  if (!canView) return <AdminNotFound forbidden />;

  const upload = async (files: FileList | File[] | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    let count = 0;
    for (const file of Array.from(files)) {
      try {
        await adminApi.uploadMedia(file, folder);
        count += 1;
      } catch (error) {
        notifyError(error, `Не удалось загрузить ${file.name}`);
      }
    }
    setUploading(false);
    if (input.current) input.current.value = "";
    if (count) notify("success", `Загружено файлов: ${count}`, "Для изображений автоматически созданы уменьшенные копии WebP.");
    void queryClient.invalidateQueries({ queryKey: ["admin", "media"] });
  };

  return (
    <div
      onDragOver={(event) => {
        if (!canAdd) return;
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (canAdd) void upload(event.dataTransfer.files);
      }}
      className={cn("relative rounded-3xl transition", dragging && "ring-4 ring-glacier-400/50")}
    >
      <PageHeader
        title="Галерея и медиатека"
        description="Все изображения и видео сайта. Перетащите файлы в окно, чтобы загрузить. Допустимы JPG, PNG, WebP, GIF (до 12 МБ) и MP4/WebM (до 80 МБ)."
        actions={
          canAdd ? (
            <>
              <input ref={input} type="file" multiple accept="image/*,video/mp4,video/webm" className="hidden" onChange={(event) => void upload(event.target.files)} />
              <Button loading={uploading} icon={<Upload className="h-4 w-4" aria-hidden />} onClick={() => input.current?.click()}>
                Загрузить файлы
              </Button>
            </>
          ) : null
        }
      />
      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr_1fr]">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-graphite-400" aria-hidden />
          <input type="search" aria-label="Поиск файлов" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Поиск по alt-тексту, имени файла, автору…" className={cn(inputClasses(), "h-11 py-2 pl-10")} />
        </div>
        <select aria-label="Тип файла" value={kind} onChange={(event) => { setKind(event.target.value); setPage(1); }} className={cn(inputClasses(), "h-11 py-2")}>
          <option value="">Все типы</option>
          <option value="image">Изображения</option>
          <option value="video">Видео</option>
        </select>
        <select aria-label="Папка" value={folder} onChange={(event) => { setFolder(event.target.value); setPage(1); }} className={cn(inputClasses(), "h-11 py-2")}>
          <option value="">Все папки</option>
          {(folders.data ?? []).map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
      {query.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner label="Загрузка медиатеки…" />
        </div>
      ) : (
        <ul className={cn("grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6", query.isFetching && "opacity-70")}>
          {(query.data?.results ?? []).map((asset) => (
            <li key={asset.id}>
              <button type="button" onClick={() => setEditing(asset)} className="group block w-full overflow-hidden rounded-2xl border border-graphite-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="relative aspect-square bg-graphite-100">
                  {asset.kind === "video" ? <video src={asset.url} muted className="h-full w-full object-cover" /> : <img src={asset.thumbnail_url} alt={asset.display_name} loading="lazy" className="h-full w-full object-cover" />}
                  {asset.is_demo ? (
                    <span className="absolute top-2 left-2">
                      <DemoBadge />
                    </span>
                  ) : null}
                </div>
                <div className="space-y-1 p-3">
                  <p className="truncate text-sm font-semibold text-night-900">{asset.display_name || asset.original_name}</p>
                  <div className="flex items-center justify-between gap-2 text-xs text-graphite-500">
                    <span className="truncate">{asset.folder || "—"}</span>
                    <TranslationBadges missing={asset.missing_translations} />
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
      {query.data && query.data.total_pages > 1 ? (
        <div className="mt-6 flex items-center justify-center gap-3 text-sm">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
            Назад
          </Button>
          <span>
            {query.data.page} / {query.data.total_pages} · всего {query.data.count}
          </span>
          <Button size="sm" variant="outline" disabled={page >= query.data.total_pages} onClick={() => setPage((value) => value + 1)}>
            Вперёд
          </Button>
        </div>
      ) : null}
      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} title="Файл медиатеки" size="xl" closeLabel="Закрыть">
        {editing ? <AssetEditor key={editing.id} asset={editing} onClose={() => setEditing(null)} /> : null}
      </Dialog>
    </div>
  );
}
