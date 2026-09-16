import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TopBar } from "../components/Layout";
import { Field, Select, Stepper } from "../components/ui";
import { ArrowLeft, CheckIcon } from "../components/icons";
import { createParticipant, emailTaken, listExpertiseAreas, listLocations } from "../data/api";
import { HOURS_CHOICES } from "../data/config";
import type { NewParticipantInput } from "../types";

const STEPS = ["Basic Info", "Expertise", "Availability"];

type Errors = Partial<Record<keyof NewParticipantInput, string>>;

export default function AddParticipant() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const areas = listExpertiseAreas();
  const locations = listLocations();
  const [errors, setErrors] = useState<Errors>({});

  const [form, setForm] = useState<NewParticipantInput>({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    about: "",
    expertiseIds: [],
    availabilityHoursPerWeek: 0,
    consentToContact: false,
  });

  function set<K extends keyof NewParticipantInput>(
    key: K,
    value: NewParticipantInput[K],
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

  /** Validates only the step being left, so people aren't shown errors early. */
  function validateStep(which: number): boolean {
    const next: Errors = {};

    if (which === 0) {
      if (!form.fullName.trim()) next.fullName = "Please enter a full name.";
      if (!form.email.trim()) {
        next.email = "Please enter an email address.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        next.email = "That doesn't look like a valid email address.";
      } else if (emailTaken(form.email)) {
        next.email = "Someone in the directory already uses this email.";
      }
      if (!form.phone.trim()) {
        next.phone = "Please enter a phone number.";
      } else if (form.phone.replace(/\D/g, "").length < 10) {
        next.phone = "Please enter at least 10 digits.";
      }
    }

    if (which === 1 && form.expertiseIds.length === 0) {
      next.expertiseIds = "Pick at least one area of expertise.";
    }

    if (which === 2) {
      if (!form.availabilityHoursPerWeek) {
        next.availabilityHoursPerWeek = "Please choose an availability.";
      }
      if (!form.consentToContact) {
        next.consentToContact =
          "We need consent before we can contact this person.";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function next() {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function submit() {
    if (!validateStep(2)) return;
    setSaving(true);
    try {
      const created = await createParticipant({
        ...form,
        location: form.location || undefined,
        about: form.about || undefined,
      });
      navigate(`/people/${created.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <TopBar
        title="Add Participant"
        subtitle="Help us build a stronger community. Fill in your details to get started."
      />

      <div className="content">
        <Link to="/people" className="backlink">
          <ArrowLeft /> Back to List
        </Link>

        <div className="card" style={{ padding: "var(--sp-6)", maxWidth: 880 }}>
          <Stepper steps={STEPS} current={step} />

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
                />
              </Field>

              <Field label="Location" htmlFor="location">
                <Select
                  id="location"
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                >
                  <option value="">Select a location</option>
                  {locations.map((l) => (
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
                label="Expertise / Skills"
                required
                full
                error={errors.expertiseIds}
                hint="Select everything that applies — this is how coordinators find the right people for a project."
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
                label="Additional Details (Optional)"
                full
                htmlFor="about"
                hint="Anything else worth knowing — background, interests, languages."
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
              marginTop: "var(--sp-7)",
              justifyContent: "flex-end",
            }}
          >
            {step > 0 && (
              <button
                className="btn btn--ghost"
                onClick={() => setStep((s) => s - 1)}
                disabled={saving}
              >
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button className="btn btn--primary" onClick={next}>
                Continue
              </button>
            ) : (
              <button
                className="btn btn--primary"
                onClick={submit}
                disabled={saving}
              >
                {saving ? "Submitting..." : "Submit"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
