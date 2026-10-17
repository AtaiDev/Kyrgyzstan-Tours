import type { ImgHTMLAttributes } from "react";
import { useState } from "react";

import type { Media } from "@/types/api";
import { cn } from "@/utils/cn";

interface ResponsiveImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet"> {
  media: Media | null | undefined;
  sizes?: string;
  priority?: boolean;
  fallbackClassName?: string;
}

export function mediaSrcSet(media: Media): string {
  const entries = [`${media.thumbnail_url} 560w`, `${media.medium_url} 1400w`];
  const hasLarge = Boolean(media.large_url) && media.large_url !== media.url;
  if (hasLarge) entries.push(`${media.large_url} 2560w`);
  if (media.url !== media.medium_url && media.width && media.width > (hasLarge ? 2560 : 1400)) entries.push(`${media.url} ${media.width}w`);
  return entries.join(", ");
}

export function ResponsiveImage({ media, sizes = "100vw", priority, className, alt, fallbackClassName, ...rest }: ResponsiveImageProps) {
  const [loaded, setLoaded] = useState(false);
  if (!media) {
    return (
      <div
        aria-hidden
        className={cn("bg-gradient-to-br from-night-700 via-night-600 to-glacier-700", className, fallbackClassName)}
      />
    );
  }
  return (
    <img
      src={media.medium_url}
      srcSet={mediaSrcSet(media)}
      sizes={sizes}
      alt={alt ?? media.alt}
      width={media.width ?? undefined}
      height={media.height ?? undefined}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : undefined}
      onLoad={() => setLoaded(true)}
      className={cn("object-cover transition-opacity duration-700", loaded || priority ? "opacity-100" : "opacity-0", className)}
      {...rest}
    />
  );
}

export function PhotoCredit({ media, className }: { media: Media | null | undefined; className?: string }) {
  if (!media?.author) return null;
  const label = `© ${media.author}${media.license ? ` · ${media.license}` : ""}`;
  return media.source_url ? (
    <a
      href={media.source_url}
      target="_blank"
      rel="noreferrer noopener"
      className={cn("text-[0.68rem] tracking-wide text-white/70 hover:text-white", className)}
    >
      {label}
    </a>
  ) : (
    <span className={cn("text-[0.68rem] tracking-wide text-white/70", className)}>{label}</span>
  );
}
