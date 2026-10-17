import { publicApi } from "@/api/public";
import { Button } from "@/components/ui/Button";
import { TextAreaField, TextField } from "@/components/ui/Fields";
import { useI18n } from "@/i18n/context";

import { ConsentField, FormAlert, FormSuccess, Honeypot, SubmitButton } from "./FormParts";
import type { FormErrors } from "./useForm";
import { EMAIL_PATTERN, useForm } from "./useForm";

const INITIAL = { full_name: "", email: "", phone: "", subject: "", message: "", consent: false, website: "" };

type ContactValues = typeof INITIAL;

export function ContactForm() {
  const { t, language } = useI18n();
  const validate = (values: ContactValues) => {
    const errors: FormErrors<ContactValues> = {};
    if (values.full_name.trim().length < 2) errors.full_name = t("form.minLength", { count: 2 });
    if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = t("form.invalidEmail");
    if (values.message.trim().length < 10) errors.message = t("form.minLength", { count: 10 });
    if (!values.consent) errors.consent = t("form.consentRequired");
    return errors;
  };
  const form = useForm(INITIAL, validate);
  const { values, errors, setField, status } = form;

  if (status === "success") {
    return (
      <FormSuccess
        title={t("form.contactSuccessTitle")}
        text={t("form.contactSuccessText")}
        action={
          <Button variant="outline" onClick={form.reset}>
            {t("form.sendAnother")}
          </Button>
        }
      />
    );
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void form.submit((data) => publicApi.submitContact(language, data));
      }}
      className="relative grid grid-cols-1 gap-5 sm:grid-cols-2"
    >
      <Honeypot value={values.website} onChange={(value) => setField("website", value)} />
      <TextField label={t("form.fullName")} autoComplete="name" value={values.full_name} onChange={(event) => setField("full_name", event.target.value)} error={errors.full_name} required />
      <TextField type="email" label={t("form.email")} autoComplete="email" value={values.email} onChange={(event) => setField("email", event.target.value)} error={errors.email} required />
      <TextField type="tel" label={t("form.phone")} autoComplete="tel" value={values.phone} onChange={(event) => setField("phone", event.target.value)} optional={t("form.optional")} />
      <TextField label={t("form.subject")} value={values.subject} onChange={(event) => setField("subject", event.target.value)} optional={t("form.optional")} maxLength={200} />
      <TextAreaField wrapperClassName="sm:col-span-2" label={t("form.message")} value={values.message} onChange={(event) => setField("message", event.target.value)} error={errors.message} rows={6} maxLength={5000} required />
      <ConsentField checked={values.consent} onChange={(value) => setField("consent", value)} error={errors.consent} />
      <div className="space-y-4 sm:col-span-2">
        <FormAlert message={form.formError} />
        <SubmitButton submitting={status === "submitting"}>{t("form.submitMessage")}</SubmitButton>
      </div>
    </form>
  );
}
