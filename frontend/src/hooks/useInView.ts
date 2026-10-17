import { useEffect, useState } from "react";

export function useInView<T extends Element>(options: { rootMargin?: string; once?: boolean } = {}) {
  const { rootMargin = "0px", once = false } = options;
  const [element, setElement] = useState<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && once) observer.disconnect();
      },
      { rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [element, rootMargin, once]);

  return [setElement, inView] as const;
}
