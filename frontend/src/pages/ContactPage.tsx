import { Clock, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";

import { useSite } from "@/api/queries";
import { PageHero } from "@/components/layout/PageHero";
import { Reveal } from "@/components/motion/Reveal";
import { ContactForm } from "@/features/forms/ContactForm";
import { RouteMap } from "@/features/map/RouteMap";
import { useSeo } from "@/hooks/useSeo";
import { useI18n } from "@/i18n/context";

export default function ContactPage() {
  const { t } = useI18n();
  const { data: site } = useSite();
  useSeo({ pageKey: "contact", title: t("page.contactTitle") });
  const contacts = site?.contacts;
  const office = contacts?.office_latitude && contacts.office_longitude ? [{ latitude: contacts.office_latitude, longitude: contacts.office_longitude, title: site?.site_name ?? "" }] : [];

  const items = [
    contacts?.email ? { icon: Mail, label: t("form.email"), value: contacts.email, href: `mailto:${contacts.email}` } : null,
    contacts?.phone ? { icon: Phone, label: t("form.phone"), value: contacts.phone, href: `tel:${contacts.phone.replace(/\s+/g, "")}` } : null,
    contacts?.whatsapp ? { icon: MessageCircle, label: "WhatsApp", value: contacts.whatsapp, href: `https://wa.me/${contacts.whatsapp.replace(/\D/g, "")}` } : null,
    contacts?.telegram ? { icon: Send, label: "Telegram", value: contacts.telegram, href: `https://t.me/${contacts.telegram.replace(/^@/, "")}` } : null,
    site?.address ? { icon: MapPin, label: t("contact.address"), value: site.address, href: null } : null,
    site?.working_hours ? { icon: Clock, label: t("contact.hours"), value: site.working_hours, href: null } : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <>
      <PageHero title={t("page.contactTitle")} subtitle={t("page.contactSubtitle")} image={site?.default_og_image} crumbs={[{ label: t("nav.contact") }]} />
      <section className="bg-milk-100 py-16 sm:py-20">
        <div className="container-page grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
          <Reveal className="space-y-8">
            <div>
              <h2 className="font-display text-3xl font-semibold text-night-900">{t("contact.details")}</h2>
              <ul className="mt-6 space-y-4">
                {items.map(({ icon: ItemIcon, label, value, href }) => (
                  <li key={label} className="flex items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-glacier-700 shadow-[var(--shadow-soft)]">
                      <ItemIcon className="h-5 w-5" aria-hidden />
                    </span>
                    <span>
                      <span className="block text-xs tracking-wide text-graphite-500 uppercase">{label}</span>
                      {href ? (
                        <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer noopener" className="font-semibold text-night-900 hover:text-glacier-700">
                          {value}
                        </a>
                      ) : (
                        <span className="font-semibold text-night-900">{value}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {office.length ? <RouteMap points={office} activeIndex={0} /> : null}
          </Reveal>
          <Reveal delay={0.1} className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-lift)] sm:p-10">
            <h2 className="mb-8 font-display text-3xl font-semibold text-night-900">{t("contact.writeUs")}</h2>
            <ContactForm />
          </Reveal>
        </div>
      </section>
    </>
  );
}
