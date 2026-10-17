import type { MessageKey } from "@/i18n/types";

export const MAIN_NAVIGATION: Array<{ to: string; label: MessageKey }> = [
  { to: "/destinations", label: "nav.destinations" },
  { to: "/tours", label: "nav.tours" },
  { to: "/guides", label: "nav.guides" },
  { to: "/routes", label: "nav.routes" },
  { to: "/about", label: "nav.about" },
  { to: "/blog", label: "nav.blog" },
];

export const FOOTER_EXPLORE: Array<{ to: string; label: MessageKey }> = [
  { to: "/destinations", label: "nav.destinations" },
  { to: "/tours", label: "nav.tours" },
  { to: "/routes", label: "nav.routes" },
  { to: "/guides", label: "nav.guides" },
];

export const FOOTER_COMPANY: Array<{ to: string; label: MessageKey }> = [
  { to: "/about", label: "nav.about" },
  { to: "/blog", label: "nav.blog" },
  { to: "/reviews", label: "nav.reviews" },
  { to: "/faq", label: "nav.faq" },
  { to: "/contact", label: "nav.contact" },
];
