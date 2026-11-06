import { ArrowLeft, ArrowRight, MessageCircle, Phone, Send } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "react-router";

import { publicApi } from "@/api/public";
import { useDestinations, useSite, useTours } from "@/api/queries";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Fields";
import { ChoiceField, ConsentField, FormAlert, FormSuccess, Honeypot, StepperField, SubmitButton } from "@/features/forms/FormParts";
import { EMAIL_PATTERN, useForm } from "@/features/forms/useForm";
import type { FormErrors } from "@/features/forms/useForm";
import { useI18n } from "@/i18n/context";
import type { BookingPayload, SiteContacts } from "@/types/api";
import { cn } from "@/utils/cn";
import { phoneLink, telegramLink, whatsappLink } from "@/utils/links";

const BUDGETS = ["under_300", "300_700", "700_1500", "over_1500", "flexible"] as const;
// Messengers first: most visitors from the region answer there faster than by email.
const METHODS = ["whatsapp", "telegram", "phone", "email"] as const;

interface LeadValues {
  destination: string;
  tour: string;
  travel_date: string;
  travelers: number;
  budget: string;
  full_name: string;
  email: string;
  phone: string;
  preferred_contact: BookingPayload["preferred_contact"];
  message: string;
  consent: boolean;
  website: string;
}

// The page the visitor is on says what they are looking at, so the request starts pre-filled.
function contextFromPath(pathname: string) {
  const match = pathname.match(/\/(tours|destinations)\/([^/?#]+)/);
  return { tour: match?.[1] === "tours" ? match[2] : "", destination: match?.[1] === "destinations" ? match[2] : "" };
}

function QuickChannels({ contacts }: { contacts: SiteContacts }) {
  const { t } = useI18n();
  const links = [
    contacts.whatsapp ? { href: whatsappLink(contacts.whatsapp), label: "WhatsApp", icon: MessageCircle, external: true } : null,
    contacts.telegram ? { href: telegramLink(contacts.telegram), label: "Telegram", icon: Send, external: true } : null,
    contacts.phone ? { href: phoneLink(contacts.phone), label: t("contact.call"), icon: Phone, external: false } : null,
  ].filter((link): link is { href: string; label: string; icon: LucideIcon; external: boolean } => link !== null);
  if (!links.length) return null;
  return (
    <div className="mt-2 mb-6">
      <p className="mb-2 text-[0.68rem] font-semibold tracking-[0.14em] text-graphite-500 uppercase">{t("contact.instant")}</p>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))` }}>
        {links.map(({ href, label, icon: Icon, external }) => (
          <a
            key={label}
            href={href}
            {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
            className="flex flex-col items-center justify-center gap-1 rounded-xl border border-graphite-200 bg-white px-2 py-2.5 text-xs font-semibold sm:flex-row sm:gap-2 sm:px-3 sm:py-3 sm:text-sm text-night-900 transition hover:border-night-900/40 hover:bg-milk-100"
          >
            <Icon className="h-4 w-4 shrink-0 text-glacier-700" aria-hidden />
            <span className="truncate">{label}</span>
          </a>
        ))}
      </div>
      <div className="mt-6 flex items-center gap-3 text-xs text-graphite-500">
        <span className="h-px flex-1 bg-graphite-200" aria-hidden />
        {t("contact.orRequest")}
        <span className="h-px flex-1 bg-graphite-200" aria-hidden />
      </div>
    </div>
  );
}

function LeadForm({ initial }: { initial: { tour: string; destination: string } }) {
  const { t, language } = useI18n();
  const location = useLocation();
  const today = new Date().toISOString().slice(0, 10);
  const [step, setStep] = useState<1 | 2>(1);
  const start = useMemo<LeadValues>(
    () => ({ ...initial, travel_date: "", travelers: 2, budget: "", full_name: "", email: "", phone: "", preferred_contact: "whatsapp", message: "", consent: false, website: "" }),
    [initial],
  );
  const validate = (values: LeadValues) => {
    const errors: FormErrors<LeadValues> = {};
    if (values.travel_date && values.travel_date < today) errors.travel_date = t("form.datePast");
    if (values.full_name.trim().length < 2) errors.full_name = t("form.minLength", { count: 2 });
    if (values.preferred_contact === "email" || values.email.trim()) {
      if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = t("form.invalidEmail");
    }
    if (values.preferred_contact !== "email" && !values.phone.trim()) errors.phone = t("form.phoneRequired");
    if (!values.consent) errors.consent = t("form.consentRequired");
    return errors;
  };
  const form = useForm(start, validate);
  const { values, errors, setField, status } = form;
  const { data: destinations } = useDestinations({ page_size: 100 });
  const { data: tours } = useTours(values.destination ? { page_size: 100, destination: values.destination } : { page_size: 100 });

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Enter on the first step means "next", not "send" — the contact fields are not on screen yet.
    if (step === 1) return setStep(2);
    const element = event.currentTarget;
    if (validate(values).travel_date) setStep(1);
    await form.submit(
      (data) =>
        publicApi.submitBooking(language, {
          tour: data.tour || null,
          destination: data.destination || null,
          guide: null,
          budget: data.budget,
          full_name: data.full_name,
          email: data.email.trim(),
          phone: data.phone,
          preferred_contact: data.preferred_contact,
          travel_date: data.travel_date || null,
          travelers: Number(data.travelers),
          message: data.message,
          source_page: `${location.pathname} · contact widget`,
          consent: data.consent,
          website: data.website,
        }),
      element,
    );
  };

  if (status === "success") {
    return (
      <FormSuccess
        title={t("form.bookingSuccessTitle")}
        text={t("form.bookingSuccessText")}
        action={
          <Button
            variant="outline"
            onClick={() => {
              form.reset();
              setStep(1);
            }}
          >
            {t("form.sendAnother")}
          </Button>
        }
      />
    );
  }

  const messenger = values.preferred_contact !== "email";
  return (
    <form onSubmit={onSubmit} noValidate className="relative">
      <Honeypot value={values.website} onChange={(value) => setField("website", value)} />
      <ol className="mb-5 flex items-center gap-2 text-xs font-semibold" aria-label={t("contact.title")}>
        {[t("contact.stepTrip"), t("contact.stepContacts")].map((label, index) => (
          <li key={label} aria-current={step === index + 1 ? "step" : undefined} className={cn("flex items-center gap-2", step === index + 1 ? "text-night-900" : "text-graphite-400")}>
            <span className={cn("flex h-6 w-6 items-center justify-center rounded-full", step === index + 1 ? "bg-night-900 text-milk-50" : "bg-graphite-100")}>{index + 1}</span>
            {label}
            {index === 0 ? <span className="mx-1 h-px w-6 bg-graphite-200" aria-hidden /> : null}
          </li>
        ))}
      </ol>

      {step === 1 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <SelectField
            label={t("contact.destination")}
            value={values.destination}
            onChange={(value) => {
              setField("destination", value);
              setField("tour", "");
            }}
            placeholder={t("contact.anyDestination")}
            options={(destinations?.results ?? []).map((item) => ({ value: item.slug, label: item.name }))}
          />
          <SelectField
            label={t("contact.tour")}
            value={values.tour}
            onChange={(value) => setField("tour", value)}
            placeholder={t("contact.anyTour")}
            options={(tours?.results ?? []).map((item) => ({ value: item.slug, label: item.title }))}
          />
          <TextField
            type="date"
            min={today}
            label={t("form.travelDate")}
            value={values.travel_date}
            onChange={(event) => setField("travel_date", event.target.value)}
            error={errors.travel_date}
            optional={t("form.optional")}
          />
          <StepperField label={t("form.travelers")} value={values.travelers} min={1} max={60} onChange={(value) => setField("travelers", value)} />
          <ChoiceField
            className="sm:col-span-2"
            name="budget"
            label={t("contact.budget")}
            value={values.budget}
            onChange={(value) => setField("budget", value)}
            options={BUDGETS.map((budget) => ({ value: budget, label: t(`contact.budget.${budget}`) }))}
          />
          <div className="sm:col-span-2">
            <Button type="submit" className="w-full">
              {t("contact.next")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextField
            wrapperClassName="sm:col-span-2"
            label={t("form.fullName")}
            autoComplete="name"
            value={values.full_name}
            onChange={(event) => setField("full_name", event.target.value)}
            error={errors.full_name}
            autoFocus
          />
          <ChoiceField
            className="sm:col-span-2"
            name="lead_contact"
            label={t("form.preferredContact")}
            value={values.preferred_contact}
            onChange={(value) => setField("preferred_contact", value)}
            options={METHODS.map((method) => ({ value: method, label: t(`form.contact.${method}`) }))}
          />
          <TextField
            type="tel"
            label={t("form.phone")}
            autoComplete="tel"
            inputMode="tel"
            value={values.phone}
            onChange={(event) => setField("phone", event.target.value)}
            error={errors.phone}
            optional={messenger ? undefined : t("form.optional")}
          />
          <TextField
            type="email"
            label={t("form.email")}
            autoComplete="email"
            value={values.email}
            onChange={(event) => setField("email", event.target.value)}
            error={errors.email}
            optional={messenger ? t("form.optional") : undefined}
          />
          <TextAreaField
            wrapperClassName="sm:col-span-2"
            label={t("form.message")}
            rows={3}
            maxLength={3000}
            value={values.message}
            onChange={(event) => setField("message", event.target.value)}
            optional={t("form.optional")}
          />
          <ConsentField checked={values.consent} onChange={(value) => setField("consent", value)} error={errors.consent} />
          <div className="space-y-4 sm:col-span-2">
            <FormAlert message={form.formError} />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} icon={<ArrowLeft className="h-4 w-4" aria-hidden />}>
                {t("contact.back")}
              </Button>
              <div className="flex-1 [&>button]:w-full">
                <SubmitButton submitting={status === "submitting"}>{t("form.submit")}</SubmitButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

/** Floating "Contact us" button on every public page; text and visibility are managed in Admin → Контакты. */
export function ContactWidget() {
  const { t } = useI18n();
  const { data: site } = useSite();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState(() => contextFromPath(location.pathname));
  if (!site?.contact_widget_enabled) return null;
  // Tour pages pin a booking bar to the bottom of small screens; sit above it instead of covering its button.
  const aboveBookingBar = /\/tours\/[^/]+/.test(location.pathname);
  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => {
          setContext(contextFromPath(location.pathname));
          setOpen(true);
        }}
        className={cn(
          "fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[60] inline-flex h-13 items-center gap-2 rounded-full bg-sand-400 px-5 text-sm font-semibold text-night-950 shadow-[0_18px_40px_-12px_rgb(11_21_36/0.55)] transition duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-sand-300 sm:right-6 sm:bottom-6",
          aboveBookingBar && "max-lg:bottom-24",
          open && "pointer-events-none translate-y-3 opacity-0",
        )}
      >
        <span className="absolute inset-0 animate-soft-pulse rounded-full bg-sand-400 will-change-transform" aria-hidden />
        <span className="absolute inset-0 animate-soft-pulse rounded-full bg-sand-400 will-change-transform" style={{ animationDelay: "1.5s" }} aria-hidden />
        <MessageCircle className="relative h-5 w-5" aria-hidden />
        <span className="relative">{site.contact_cta || t("contact.cta")}</span>
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title={t("contact.title")} description={site.contact_intro || t("contact.intro")} size="lg" closeLabel={t("common.close")}>
        <QuickChannels contacts={site.contacts} />
        <LeadForm key={`${context.tour}|${context.destination}`} initial={context} />
      </Dialog>
    </>
  );
}
