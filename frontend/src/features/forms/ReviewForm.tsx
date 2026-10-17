import { publicApi } from "@/api/public";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Fields";
import { RatingInput } from "@/components/ui/Rating";
import { useI18n } from "@/i18n/context";

import { ConsentField, FormAlert, FormSuccess, Honeypot, SubmitButton } from "./FormParts";
import type { FormErrors } from "./useForm";
import { EMAIL_PATTERN, useForm } from "./useForm";

const INITIAL = {
  author_name: "",
  author_country: "",
  author_email: "",
  rating: 0,
  tour: "",
  travel_date: "",
  title: "",
  text: "",
  consent: false,
  website: "",
};

type ReviewValues = typeof INITIAL;

export function ReviewForm({ tours, defaultTour }: { tours: Array<{ slug: string; title: string }>; defaultTour?: string }) {
  const { t, language } = useI18n();
  const validate = (values: ReviewValues) => {
    const errors: FormErrors<ReviewValues> = {};
    if (values.author_name.trim().length < 2) errors.author_name = t("form.minLength", { count: 2 });
    if (!EMAIL_PATTERN.test(values.author_email.trim())) errors.author_email = t("form.invalidEmail");
    if (values.rating < 1) errors.rating = t("form.ratingRequired");
    if (values.text.trim().length < 20) errors.text = t("form.minLength", { count: 20 });
    if (!values.consent) errors.consent = t("form.consentRequired");
    return errors;
  };
  const form = useForm({ ...INITIAL, tour: defaultTour ?? "" }, validate);
  const { values, errors, setField, status } = form;

  if (status === "success") {
    return <FormSuccess title={t("form.reviewSuccessTitle")} text={t("form.reviewSuccessText")} />;
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void form.submit((data) =>
          publicApi.submitReview(language, {
            ...data,
            tour: data.tour || null,
            travel_date: data.travel_date || null,
          }),
        );
      }}
      className="relative grid grid-cols-1 gap-5 sm:grid-cols-2"
    >
      <Honeypot value={values.website} onChange={(value) => setField("website", value)} />
      <div className="sm:col-span-2">
        <p className="mb-1.5 text-sm font-semibold text-graphite-800">{t("form.rating")}</p>
        <RatingInput value={values.rating} onChange={(value) => setField("rating", value)} error={errors.rating} />
      </div>
      <TextField label={t("form.fullName")} value={values.author_name} onChange={(event) => setField("author_name", event.target.value)} error={errors.author_name} required />
      <TextField label={t("form.country")} value={values.author_country} onChange={(event) => setField("author_country", event.target.value)} optional={t("form.optional")} maxLength={80} />
      <TextField type="email" label={t("form.email")} value={values.author_email} onChange={(event) => setField("author_email", event.target.value)} error={errors.author_email} required />
      <SelectField
        label={t("form.tour")}
        value={values.tour}
        onChange={(event) => setField("tour", event.target.value)}
        placeholder={t("form.selectTour")}
        options={tours.map((tour) => ({ value: tour.slug, label: tour.title }))}
      />
      <TextField wrapperClassName="sm:col-span-2" label={t("form.reviewTitle")} value={values.title} onChange={(event) => setField("title", event.target.value)} optional={t("form.optional")} maxLength={200} />
      <TextAreaField wrapperClassName="sm:col-span-2" label={t("form.reviewText")} value={values.text} onChange={(event) => setField("text", event.target.value)} error={errors.text} rows={5} maxLength={3000} required />
      <ConsentField checked={values.consent} onChange={(value) => setField("consent", value)} error={errors.consent} />
      <div className="space-y-4 sm:col-span-2">
        <FormAlert message={form.formError} />
        <SubmitButton submitting={status === "submitting"}>{t("form.submitReview")}</SubmitButton>
      </div>
    </form>
  );
}
