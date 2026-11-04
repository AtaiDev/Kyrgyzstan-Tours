import type { MediaBrief } from "../types";

const CODEC_NAMES: Record<string, string> = { avc1: "H.264", avc3: "H.264", hvc1: "HEVC", hev1: "HEVC", av01: "AV1", vp09: "VP9" };

export function bitrateMbps(video: MediaBrief): number | null {
  return video.duration && video.file_size ? (video.file_size * 8) / video.duration / 1_000_000 : null;
}

/** One-line summary, e.g. "2560×1440 · 19 с · 13,9 Мбит/с · H.264". */
export function describeVideo(video: MediaBrief): string {
  const bitrate = bitrateMbps(video);
  return [
    video.width && video.height ? `${video.width}×${video.height}` : null,
    video.duration ? `${Math.round(video.duration)} с` : null,
    bitrate ? `${bitrate.toFixed(1).replace(".", ",")} Мбит/с` : null,
    video.video_codec ? (CODEC_NAMES[video.video_codec] ?? video.video_codec) : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Problems that would make the background look worse than the upload, or show the wrong clip. */
export function videoWarnings(video: MediaBrief, role: "main" | "light" | undefined, pair: MediaBrief | null): string[] {
  const warnings: string[] = [];
  const codec = video.video_codec ?? "";
  const bitrate = bitrateMbps(video);
  const width = video.width ?? 0;
  const height = video.height ?? 0;
  if (codec === "hvc1" || codec === "hev1") warnings.push("Кодек HEVC (H.265): Chrome и Firefox на многих компьютерах его не покажут. Нужен H.264 — при экспорте выберите «H.264 / MP4».");
  else if (codec === "av01" || codec === "vp09") warnings.push(`Кодек ${CODEC_NAMES[codec]} не поддерживается частью браузеров (Safari). Надёжнее H.264 / MP4.`);
  if (width && height && height > width) warnings.push("Вертикальное видео: на компьютере оно будет сильно обрезано по краям. Для фона нужен горизонтальный ролик 16:9.");
  if (role === "main") {
    if (width && width < 2560) {
      warnings.push(
        `Разрешение ${width}×${height}: на больших и Retina-экранах фон будет растянут и выглядеть мягким. Для чёткой картинки загрузите 2560×1440 или 3840×2160 — на стоках (Pexels и др.) это вариант «UHD», «4K» или «Original», а не «HD».`,
      );
    }
    if (bitrate && width >= 2560 && bitrate < 8) warnings.push(`Низкий битрейт для такого разрешения (${bitrate.toFixed(1)} Мбит/с): на небе и в тенях появятся «квадратики». Для 1440p лучше 10–16 Мбит/с.`);
    if (bitrate && width >= 3840 && bitrate > 30) warnings.push(`Очень высокий битрейт (${bitrate.toFixed(0)} Мбит/с): слабые компьютеры не успеют его декодировать и получат облегчённое видео. Оптимально 2560×1440 при 12–16 Мбит/с.`);
    if (video.duration && video.duration > 30) warnings.push(`Длительность ${Math.round(video.duration)} с: для фона хватает 15–20 секунд — файл меньше, видео стартует быстрее.`);
  }
  if (role === "light" && pair) {
    if (pair.id === video.id) warnings.push("Это тот же файл, что и основное видео — поле можно оставить пустым.");
    else if (video.duration && pair.duration && Math.abs(video.duration - pair.duration) > 1) {
      warnings.push(
        `Это другой ролик, не уменьшенная копия основного (${Math.round(video.duration)} с против ${Math.round(pair.duration)} с). Сайт его не будет показывать, чтобы посетители не видели разные видео. Загрузите тот же ролик в 1920×1080 или оставьте поле пустым.`,
      );
    } else if (width && pair.width && width >= pair.width) warnings.push(`Облегчённая версия не меньше основной (${width}×${height}), поэтому сайт её не использует. Нужна копия в 1920×1080.`);
  }
  return warnings;
}

/** Grabs the first frame at full resolution, so the poster shown while loading is exactly where the video starts. */
export async function captureFirstFrame(url: string): Promise<Blob> {
  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = url;
  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error("Не удалось открыть видео"));
    });
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Браузер не дал нарисовать кадр");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Не удалось сохранить кадр"))), "image/jpeg", 0.92));
  } finally {
    video.removeAttribute("src");
    video.load();
  }
}
