import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ImageOff, Search, Upload } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Spinner } from "@/components/ui/States";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/utils/cn";

import { adminApi } from "../api";
import type { MediaAsset, MediaBrief } from "../types";
import { useFeedback } from "../ui/feedback";

export function toBrief(asset: MediaAsset): MediaBrief {
  return {
    id: asset.id,
    kind: asset.kind,
    url: asset.url,
    medium_url: asset.medium_url,
    thumbnail_url: asset.thumbnail_url,
    width: asset.width,
    height: asset.height,
    original_name: asset.original_name,
    alt: asset.display_name,
  };
}

interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (assets: MediaBrief[]) => void;
  multiple?: boolean;
  kind?: "image" | "video";
  folder?: string;
}

export function MediaPicker({ open, onClose, onSelect, multiple = false, kind = "image", folder = "" }: MediaPickerProps) {
  const queryClient = useQueryClient();
  const { notifyError, notify } = useFeedback();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<MediaBrief[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounced = useDebouncedValue(search, 300);

  const query = useQuery({
    queryKey: ["admin", "media-picker", kind, debounced, page],
    queryFn: () => adminApi.media({ kind, search: debounced, page, page_size: 24 }),
    enabled: open,
    placeholderData: keepPreviousData,
  });

  const toggle = (asset: MediaBrief) => {
    if (!multiple) {
      onSelect([asset]);
      onClose();
      return;
    }
    setSelected((current) => (current.some((item) => item.id === asset.id) ? current.filter((item) => item.id !== asset.id) : [...current, asset]));
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const uploaded: MediaBrief[] = [];
    for (const file of Array.from(files)) {
      try {
        uploaded.push(toBrief(await adminApi.uploadMedia(file, folder)));
      } catch (error) {
        notifyError(error, `Не удалось загрузить ${file.name}`);
      }
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    await queryClient.invalidateQueries({ queryKey: ["admin", "media-picker"] });
    await queryClient.invalidateQueries({ queryKey: ["admin", "media"] });
    if (uploaded.length) {
      notify("success", uploaded.length > 1 ? `Загружено файлов: ${uploaded.length}` : "Файл загружен");
      if (multiple) setSelected((current) => [...current, ...uploaded]);
      else {
        onSelect(uploaded.slice(0, 1));
        onClose();
      }
    }
  };

  const results = query.data?.results ?? [];

  return (
    <Dialog open={open} onClose={onClose} title={kind === "video" ? "Выбор видео" : "Медиатека"} size="xl" closeLabel="Закрыть">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-graphite-400" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Поиск по названию, alt-тексту, автору…"
            className="h-11 w-full rounded-xl border border-graphite-200 pr-3 pl-10 text-sm focus:border-glacier-600 focus:outline-none"
          />
        </div>
        <input ref={inputRef} type="file" className="hidden" multiple={multiple} accept={kind === "video" ? "video/mp4,video/webm" : "image/*"} onChange={(event) => void upload(event.target.files)} />
        <Button variant="accent" loading={uploading} icon={<Upload className="h-4 w-4" aria-hidden />} onClick={() => inputRef.current?.click()}>
          Загрузить с компьютера
        </Button>
      </div>
      <div className="mt-5 min-h-[300px]">
        {query.isLoading ? (
          <div className="flex h-60 items-center justify-center">
            <Spinner label="Загрузка медиатеки…" />
          </div>
        ) : results.length === 0 ? (
          <div className="flex h-60 flex-col items-center justify-center gap-2 text-graphite-500">
            <ImageOff className="h-8 w-8" aria-hidden />
            Файлы не найдены. Загрузите новый файл.
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {results.map((asset) => {
              const brief = toBrief(asset);
              const active = selected.some((item) => item.id === asset.id);
              return (
                <li key={asset.id}>
                  <button
                    type="button"
                    onClick={() => toggle(brief)}
                    aria-pressed={active}
                    className={cn("group relative block aspect-square w-full overflow-hidden rounded-xl border-2 transition", active ? "border-glacier-600" : "border-transparent hover:border-graphite-300")}
                  >
                    {asset.kind === "video" ? (
                      <video src={asset.url} className="h-full w-full object-cover" muted />
                    ) : (
                      <img src={asset.thumbnail_url} alt={asset.display_name} loading="lazy" className="h-full w-full object-cover" />
                    )}
                    <span className="absolute inset-x-0 bottom-0 truncate bg-night-950/70 px-2 py-1 text-left text-[0.65rem] text-milk-50">{asset.display_name || asset.original_name}</span>
                    {active ? (
                      <span className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-glacier-600 text-white">
                        <Check className="h-4 w-4" aria-hidden />
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-graphite-600">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
            Назад
          </Button>
          <span>
            {query.data?.page ?? 1} / {query.data?.total_pages ?? 1}
          </span>
          <Button variant="outline" size="sm" disabled={!query.data || page >= query.data.total_pages} onClick={() => setPage((value) => value + 1)}>
            Вперёд
          </Button>
        </div>
        {multiple ? (
          <Button
            disabled={!selected.length}
            onClick={() => {
              onSelect(selected);
              setSelected([]);
              onClose();
            }}
          >
            Добавить выбранные ({selected.length})
          </Button>
        ) : null}
      </div>
    </Dialog>
  );
}
