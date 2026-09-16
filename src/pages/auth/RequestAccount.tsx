import { useState } from "react";
import { Link } from "react-router-dom";
import AuthShell, { Notice } from "../../components/AuthShell";
import { Field, Select, Stepper } from "../../components/ui";
import { CheckIcon } from "../../components/icons";
import { HOURS_CHOICES } from "../../data/config";
import {
  listExpertiseAreas,
  listLocations,
  submitAccountRequest,
} from "../../data/api";
import type { AccountRequestInput } from "../../types";

const STEPS = ["Basic Info", "Expertise", "Availability"];

type Errors = Partial<Record<keyof AccountRequestInput | "form", string>>;

const SUBMIT_ERRORS: Record<string, string> = {
  ALREADY_A_MEMBER:
    "There is already an account with this email. Try signing in instead.",
  ALREADY_REQUESTED:
    "We've already got a request from this email address and it's waiting for review.",
  "auth/email-already-in-use":
    "A Firebase account already uses this email. Try signing in instead.",
  "auth/weak-password": "Choose a stronger password with at least 8 characters.",
};

/**
 * The public front door: Firebase creates the identity, then an administrator
 * reviews the profile before it becomes an active participant.
 */
export default function RequestAccount() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const areas = listExpertiseAreas();

  const [form, setForm] = useState<AccountRequestInput>({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    about: "",
    expertiseIds: [],
    availabilityHoursPerWeek: 0,
    consentToContact: false,
  });

  function set<K extends keyof AccountRequestInput>(
    key: K,
    value: AccountRequestInput[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function toggleExpertise(id: string) {
    setForm((f) => ({
      ...f,
      expertiseIds: f.expertiseIds.includes(id)
        ? f.expertiseIds.filter((x) => x !== id)
        : [...f.expertiseIds, id],
    }));
    setErrors((e) => ({ ...e, expertiseIds: undefined }));
  }

  function validateStep(which: number): boolean {
    const next: Errors = {};

    if (which === 0) {
      if (!form.fullName.trim()) next.fullName = "Please enter your full name.";
      if (!form.email.trim()) {
        next.email = "Please enter an email address.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        next.email = "That doesn't look like a valid email address.";
      }
      if (!form.phone.trim()) {
        next.phone = "Please enter a phone number.";
      } else if (form.phone.replace(/\D/g, "").length < 10) {
        next.phone = "Please enter at least 10 digits.";
      }
      if (password.length < 8) {
        next.form = "Choose a password with at least 8 characters.";
      }
    }

    if (which === 1 && form.expertiseIds.length === 0) {
      next.expertiseIds = "Pick at least one area you can help with.";
    }

    if (which === 2) {
      if (!form.availabilityHoursPerWeek) {
        next.availabilityHoursPerWeek = "Please choose how much time you can give.";
      }
      if (!form.consentToContact) {
        next.consentToContact =
          "We need your consent before we can get in touch.";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit() {
    if (!validateStep(2)) return;
    setBusy(true);
    try {
      await submitAccountRequest(
        {
          ...form,
          location: form.location || undefined,
          about: form.about || undefined,
        },
        password,
      );
      setDone(true);
    } catch (err) {
      const code = (err as { code?: string }).code ?? (err as Error).message;
      setErrors({ form: SUBMIT_ERRORS[code] ?? "Something went wrong. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <AuthShell
        title="Request received"
        lede="Thank you for offering your time to Kanak Parakh Foundation."
        footer={<Link to="/login">Back to sign in</Link>}
      >
        <Notice kind="ok">
          An administrator will review your request. Once it's approved you'll be
          able to sign in with <strong>{form.email}</strong> and start picking up
          volunteering slots.
        </Notice>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Request to volunteer"
      lede="Tell us a little about yourself and how you'd like to help. An administrator will review your request."
      wide
      footer={
        <>
          Already have an account? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <Stepper steps={STEPS} current={step} />

      {errors.form && (
        <div style={{ marginBottom: "var(--sp-4)" }}>
          <Notice kind="error">{errors.form}</Notice>
        </div>
      )}

      {step === 0 && (
        <div className="form-grid">
          <Field label="Full Name" required htmlFor="fullName" error={errors.fullName}>
            <input
              id="fullName"
              className="input"
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder="Enter your full name"
              aria-invalid={Boolean(errors.fullName)}
              autoComplete="name"
            />
          </Field>

          <Field label="Email Address" required htmlFor="email" error={errors.email}>
            <input
              id="email"
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="you@domain.com"
              aria-invalid={Boolean(errors.email)}
              autoComplete="email"
            />
          </Field>

          <Field label="Phone Number" required htmlFor="phone" error={errors.phone}>
            <input
              id="phone"
              type="tel"
              className="input"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+91 98765 43210"
              aria-invalid={Boolean(errors.phone)}
              autoComplete="tel"
            />
          </Field>

          <Field label="Create a Password" required htmlFor="password">
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((current) => ({ ...current, form: undefined }));
              }}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
          </Field>

          <Field label="Location" htmlFor="location">
            <Select
              id="location"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
            >
              <option value="">Select a location</option>
              {listLocations().map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      )}

      {step === 1 && (
        <div className="form-grid">
          <Field
            label="How can you help?"
            required
            full
            error={errors.expertiseIds}
            hint="Select everything that applies — this is how coordinators match you to the right work."
          >
            <div className="tags" style={{ paddingTop: 4 }}>
              {areas.map((a) => {
                const on = form.expertiseIds.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    className={`tag tag--${a.colorToken} tag--toggle`}
                    aria-pressed={on}
                    onClick={() => toggleExpertise(a.id)}
                    style={{ padding: "6px 14px", fontSize: "var(--text-sm)" }}
                  >
                    {on && <CheckIcon style={{ width: 13, height: 13, marginRight: 5 }} />}
                    {a.name}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field
            label="Anything else we should know? (Optional)"
            full
            htmlFor="about"
            hint="Background, interests, languages — whatever helps us place you well."
          >
            <textarea
              id="about"
              className="textarea"
              value={form.about}
              onChange={(e) => set("about", e.target.value)}
              placeholder="Tell us more about yourself or any specific interests..."
            />
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="form-grid">
          <Field
            label="Availability"
            required
            htmlFor="availability"
            error={errors.availabilityHoursPerWeek}
            hint={
              form.availabilityHoursPerWeek
                ? `That's about ${form.availabilityHoursPerWeek * 4} hrs / month.`
                : undefined
            }
          >
            <Select
              id="availability"
              value={form.availabilityHoursPerWeek || ""}
              onChange={(e) =>
                set("availabilityHoursPerWeek", Number(e.target.value))
              }
              aria-invalid={Boolean(errors.availabilityHoursPerWeek)}
            >
              <option value="">Select your availability</option>
              {HOURS_CHOICES.map((h) => (
                <option key={h} value={h}>
                  {h} hrs / week
                </option>
              ))}
            </Select>
          </Field>

          <div className="form-grid--full">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.consentToContact}
                onChange={(e) => set("consentToContact", e.target.checked)}
              />
              <span>
                I agree to be contacted by Kanak Parakh Foundation
                {errors.consentToContact && (
                  <span className="field__error" style={{ display: "block" }}>
                    {errors.consentToContact}
                  </span>
                )}
              </span>
            </label>
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: "var(--sp-3)",
          marginTop: "var(--sp-6)",
          justifyContent: "flex-end",
        }}
      >
        {step > 0 && (
          <button
            className="btn btn--ghost"
            onClick={() => setStep((s) => s - 1)}
            disabled={busy}
          >
            Back
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button
            className="btn btn--primary"
            onClick={() => validateStep(step) && setStep((s) => s + 1)}
          >
            Continue
          </button>
        ) : (
          <button className="btn btn--primary" onClick={submit} disabled={busy}>
            {busy ? "Submitting..." : "Submit request"}
          </button>
        )}
      </div>
    </AuthShell>
  );
}
