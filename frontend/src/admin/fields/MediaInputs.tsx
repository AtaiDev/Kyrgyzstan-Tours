import { ArrowLeft, ArrowRight, ImagePlus, Images, Replace, Trash2, Upload, Video } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/Button";

import { adminApi } from "../api";
import type { MediaBrief } from "../types";
import { useFeedback } from "../ui/feedback";
import { MediaPicker, toBrief } from "./MediaPicker";

interface MediaInputProps {
  value: MediaBrief | null;
  onChange: (value: MediaBrief | null) => void;
  kind?: "image" | "video";
  folder?: string;
  id?: string;
}

export function MediaInput({ value, onChange, kind = "image", folder = "", id }: MediaInputProps) {
  const [picking, setPicking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { notifyError, notify } = useFeedback();

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const asset = await adminApi.uploadMedia(file, folder);
      onChange(toBrief(asset));
      notify("success", "Файл загружен", "Не забудьте сохранить запись.");
    } catch (error) {
      notifyError(error, "Не удалось загрузить файл");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div id={id} className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <div className="relative flex aspect-[4/3] w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-graphite-300 bg-graphite-100 sm:w-56">
        {value ? (
          value.kind === "video" ? (
            <video src={value.url} className="h-full w-full object-cover" controls muted />
          ) : (
            <img src={value.thumbnail_url} alt={value.alt || value.original_name} className="h-full w-full object-cover" />
          )
        ) : kind === "video" ? (
          <Video className="h-8 w-8 text-graphite-400" aria-hidden />
        ) : (
          <ImagePlus className="h-8 w-8 text-graphite-400" aria-hidden />
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <input ref={inputRef} type="file" className="hidden" accept={kind === "video" ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp,image/gif"} onChange={(event) => void upload(event.target.files?.[0])} />
        <Button size="sm" variant="primary" loading={uploading} icon={value ? <Replace className="h-4 w-4" aria-hidden /> : <Upload className="h-4 w-4" aria-hidden />} onClick={() => inputRef.current?.click()}>
          {value ? "Заменить файлом" : "Загрузить"}
        </Button>
        <Button size="sm" variant="outline" icon={<Images className="h-4 w-4" aria-hidden />} onClick={() => setPicking(true)}>
          Из медиатеки
        </Button>
        {value ? (
          <Button size="sm" variant="ghost" icon={<Trash2 className="h-4 w-4" aria-hidden />} onClick={() => onChange(null)}>
            Убрать
          </Button>
        ) : null}
        {value ? <p className="w-full text-xs text-graphite-500">{value.original_name || value.alt}{value.width ? ` · ${value.width}×${value.height}` : ""}</p> : null}
      </div>
      <MediaPicker open={picking} onClose={() => setPicking(false)} onSelect={(assets) => onChange(assets[0] ?? null)} kind={kind} folder={folder} />
    </div>
  );
}

export function GalleryInput({ value, onChange, folder = "" }: { value: MediaBrief[]; onChange: (value: MediaBrief[]) => void; folder?: string }) {
  const [picking, setPicking] = useState(false);
  const move = (index: number, delta: number) => {
    const next = [...value];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  return (
    <div>
      {value.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {value.map((asset, index) => (
            <li key={asset.id} className="group relative overflow-hidden rounded-xl border border-graphite-200">
              <img src={asset.thumbnail_url} alt={asset.alt} className="aspect-square w-full object-cover" />
              <span className="absolute top-1.5 left-1.5 rounded-full bg-night-950/70 px-2 text-[0.65rem] font-bold text-white">{index + 1}</span>
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-night-950/70 p-1">
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="rounded p-1 text-white hover:bg-white/20 disabled:opacity-30" aria-label="Переместить влево">
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                </button>
                <button type="button" onClick={() => onChange(value.filter((item) => item.id !== asset.id))} className="rounded p-1 text-white hover:bg-danger-600" aria-label="Убрать из галереи">
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === value.length - 1} className="rounded p-1 text-white hover:bg-white/20 disabled:opacity-30" aria-label="Переместить вправо">
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-graphite-300 bg-graphite-100/60 p-6 text-center text-sm text-graphite-500">Галерея пуста</p>
      )}
      <Button size="sm" variant="outline" className="mt-3" icon={<ImagePlus className="h-4 w-4" aria-hidden />} onClick={() => setPicking(true)}>
        Добавить фотографии
      </Button>
      <MediaPicker
        open={picking}
        multiple
        folder={folder}
        onClose={() => setPicking(false)}
        onSelect={(assets) => onChange([...value, ...assets.filter((asset) => !value.some((item) => item.id === asset.id))])}
      />
    </div>
  );
}
