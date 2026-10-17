import { useMemo } from "react";
import { useLocation } from "react-router";

import { publicApi } from "@/api/public";
import { Button } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Fields";
import { useI18n } from "@/i18n/context";
import type { BookingPayload } from "@/types/api";

import { ConsentField, FormAlert, FormSuccess, Honeypot, SubmitButton } from "./FormParts";
import type { FormErrors } from "./useForm";
import { EMAIL_PATTERN, useForm } from "./useForm";

type BookingValues = Omit<BookingPayload, "tour" | "guide" | "source_page" | "travel_date"> & { travel_date: string; website: string };

const CONTACT_METHODS = ["email", "whatsapp", "telegram", "phone"] as const;

export function BookingForm({ tourSlug, guideSlug, tone = "light", tours }: { tourSlug?: string; guideSlug?: string; tone?: "light" | "dark"; tours?: Array<{ slug: string; title: string }> }) {
  const { t, language } = useI18n();
  const location = useLocation();
  const today = new Date().toISOString().slice(0, 10);
  const initial = useMemo<BookingValues & { tour: string }>(
    () => ({
      tour: tourSlug ?? "",
      full_name: "",
      email: "",
      phone: "",
      preferred_contact: "email",
      travel_date: "",
      travelers: 2,
      message: "",
      consent: false,
      website: "",
    }),
    [tourSlug],
  );

  const validate = (values: typeof initial) => {
    const errors: FormErrors<typeof initial> = {};
    if (values.full_name.trim().length < 2) errors.full_name = t("form.minLength", { count: 2 });
    if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = t("form.invalidEmail");
    if (values.preferred_contact !== "email" && !values.phone.trim()) errors.phone = t("form.phoneRequired");
    if (values.travel_date && values.travel_date < today) errors.travel_date = t("form.datePast");
    if (!values.travelers || values.travelers < 1) errors.travelers = t("form.required");
    if (!values.consent) errors.consent = t("form.consentRequired");
    return errors;
  };

  const form = useForm(initial, validate);
  const { values, errors, setField, status } = form;

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await form.submit((data) =>
      publicApi.submitBooking(language, {
        ...data,
        tour: data.tour || null,
        guide: guideSlug ?? null,
        travel_date: data.travel_date || null,
        travelers: Number(data.travelers),
        source_page: location.pathname,
      }),
    );
  };

  if (status === "success") {
    return (
      <FormSuccess
        tone={tone}
        title={t("form.bookingSuccessTitle")}
        text={t("form.bookingSuccessText")}
        action={
          <Button variant={tone === "dark" ? "light" : "outline"} onClick={form.reset}>
            {t("form.sendAnother")}
          </Button>
        }
      />
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="relative grid grid-cols-1 gap-5 sm:grid-cols-2">
      <Honeypot value={values.website} onChange={(value) => setField("website", value)} />
      {tours && tours.length ? (
        <SelectField
          tone={tone}
          wrapperClassName="sm:col-span-2"
          label={t("form.tour")}
          value={values.tour}
          onChange={(event) => setField("tour", event.target.value)}
          placeholder={t("form.selectTour")}
          options={tours.map((tour) => ({ value: tour.slug, label: tour.title }))}
        />
      ) : null}
      <TextField
        tone={tone}
        label={t("form.fullName")}
        autoComplete="name"
        value={values.full_name}
        onChange={(event) => setField("full_name", event.target.value)}
        error={errors.full_name}
        required
      />
      <TextField
        tone={tone}
        type="email"
        label={t("form.email")}
        autoComplete="email"
        value={values.email}
        onChange={(event) => setField("email", event.target.value)}
        error={errors.email}
        required
      />
      <SelectField
        tone={tone}
        label={t("form.preferredContact")}
        value={values.preferred_contact}
        onChange={(event) => setField("preferred_contact", event.target.value as BookingValues["preferred_contact"])}
        options={CONTACT_METHODS.map((method) => ({ value: method, label: t(`form.contact.${method}`) }))}
      />
      <TextField
        tone={tone}
        type="tel"
        label={t("form.phone")}
        autoComplete="tel"
        value={values.phone}
        onChange={(event) => setField("phone", event.target.value)}
        error={errors.phone}
        optional={values.preferred_contact === "email" ? t("form.optional") : undefined}
      />
      <TextField
        tone={tone}
        type="date"
        min={today}
        label={t("form.travelDate")}
        value={values.travel_date}
        onChange={(event) => setField("travel_date", event.target.value)}
        error={errors.travel_date}
        optional={t("form.optional")}
      />
      <TextField
        tone={tone}
        type="number"
        min={1}
        max={60}
        label={t("form.travelers")}
        value={values.travelers}
        onChange={(event) => setField("travelers", Number(event.target.value))}
        error={errors.travelers}
      />
      <TextAreaField
        tone={tone}
        wrapperClassName="sm:col-span-2"
        label={t("form.message")}
        value={values.message}
        onChange={(event) => setField("message", event.target.value)}
        maxLength={3000}
        optional={t("form.optional")}
      />
      <ConsentField tone={tone} checked={values.consent} onChange={(value) => setField("consent", value)} error={errors.consent} />
      <div className="space-y-4 sm:col-span-2">
        <FormAlert tone={tone} message={form.formError} />
        <SubmitButton submitting={status === "submitting"} variant={tone === "dark" ? "accent" : "primary"}>
          {t("form.submit")}
        </SubmitButton>
      </div>
    </form>
  );
}
