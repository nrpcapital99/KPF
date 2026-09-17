import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import {
  COMMITMENTS,
  FOUNDATION,
  HELP_CATEGORIES,
  LIMITS,
  TIMES,
  type HelpCategory,
} from "../config";
import {
  EMPTY_VALUES,
  FIELD_ORDER,
  toInput,
  validate,
  type FieldName,
  type FormValues,
} from "./validation";
import "./form.css";

type SubmitModule = typeof import("./submit");
let submitModule: Promise<SubmitModule> | null = null;
const loadSubmit = () => (submitModule ??= import("./submit"));

type Phase = "editing" | "sending" | "sent";

/**
 * The public volunteer form — deliberately plain: standard browser controls,
 * native dropdown lists, no decoration.
 */
export default function VolunteerForm() {
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const [phase, setPhase] = useState<Phase>("editing");
  const [sendError, setSendError] = useState<string | null>(null);
  const [thankName, setThankName] = useState("");
  const topRef = useRef<HTMLDivElement>(null);
  const doneHeadingRef = useRef<HTMLHeadingElement>(null);

  // Fetch the database code in the background once the page is idle, so the
  // form shows immediately and submitting doesn't wait on a download.
  useEffect(() => {
    const warm = () => void loadSubmit().catch(() => undefined);
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(warm, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(warm, 2500);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (phase === "sent") doneHeadingRef.current?.focus();
  }, [phase]);

  const errors = validate(values);
  const showError = (field: FieldName) =>
    attempted || touched[field] ? errors[field] : undefined;

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    if (sendError) setSendError(null);
  }

  const blur = (field: FieldName) => () =>
    setTouched((current) => ({ ...current, [field]: true }));

  /** One multi-select per help area; all of them feed the single helpWith list. */
  function setCategory(category: HelpCategory, event: ChangeEvent<HTMLSelectElement>) {
    const chosen = Array.from(event.target.selectedOptions, (option) => option.value);
    const ids = new Set(category.options.map((option) => option.id));
    setValues((current) => ({
      ...current,
      helpWith: [...current.helpWith.filter((id) => !ids.has(id)), ...chosen],
    }));
    if (sendError) setSendError(null);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setAttempted(true);
    setSendError(null);

    const firstName = values.fullName.trim().split(/\s+/)[0] ?? "";

    // A bot filled the hidden field. Show the normal thank-you and write nothing.
    if (values.website) {
      setThankName(firstName);
      setPhase("sent");
      return;
    }

    const current = validate(values);
    const firstInvalid = FIELD_ORDER.find((field) => current[field]);
    if (firstInvalid) {
      document.getElementById(`f-${firstInvalid}`)?.focus();
      return;
    }

    setPhase("sending");
    try {
      const { submitVolunteer } = await loadSubmit();
      await submitVolunteer(toInput(values));
      setThankName(firstName);
      setValues(EMPTY_VALUES);
      setTouched({});
      setAttempted(false);
      setPhase("sent");
      topRef.current?.scrollIntoView({ block: "start" });
    } catch (error) {
      const { describeSubmitError } = await loadSubmit().catch(() => ({
        describeSubmitError: () =>
          "We couldn't reach our server. Please check your connection and try again.",
      }));
      setSendError(describeSubmitError(error));
      setPhase("editing");
    }
  }

  const sending = phase === "sending";

  return (
    <div className="pf">
      <div className="pf__wrap" ref={topRef}>
        <h1>{FOUNDATION.name}</h1>
        <p className="pf__subtitle">Volunteer Registration Form</p>

        {phase === "sent" ? (
          <div role="status" aria-live="polite">
            <h2 ref={doneHeadingRef} tabIndex={-1}>
              Thank you{thankName ? `, ${thankName}` : ""}.
            </h2>
            <p>
              Your details have been received. Someone from {FOUNDATION.name} will
              contact you.
            </p>
            <p>
              <button type="button" onClick={() => setPhase("editing")}>
                Submit another response
              </button>
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate aria-busy={sending}>
            <p>
              Please fill in the form below. Fields marked <span className="pf__req">*</span>{" "}
              are required.
            </p>

            <fieldset disabled={sending}>
              <legend>1. About you</legend>

              <Field id="f-fullName" label="Full name" required error={showError("fullName")}>
                <input
                  id="f-fullName"
                  type="text"
                  value={values.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  onBlur={blur("fullName")}
                  autoComplete="name"
                  maxLength={LIMITS.name}
                  {...describedBy("f-fullName", showError("fullName"))}
                />
              </Field>

              <Field id="f-phone" label="Phone / WhatsApp" required error={showError("phone")}>
                <input
                  id="f-phone"
                  type="tel"
                  inputMode="tel"
                  value={values.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  onBlur={blur("phone")}
                  autoComplete="tel"
                  maxLength={LIMITS.phone}
                  {...describedBy("f-phone", showError("phone"))}
                />
              </Field>

              <Field id="f-email" label="Email" required error={showError("email")}>
                <input
                  id="f-email"
                  type="email"
                  inputMode="email"
                  value={values.email}
                  onChange={(e) => set("email", e.target.value)}
                  onBlur={blur("email")}
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={LIMITS.email}
                  {...describedBy("f-email", showError("email"))}
                />
              </Field>

              <Field id="f-city" label="City" error={showError("city")}>
                <input
                  id="f-city"
                  type="text"
                  value={values.city}
                  onChange={(e) => set("city", e.target.value)}
                  onBlur={blur("city")}
                  autoComplete="address-level2"
                  maxLength={LIMITS.city}
                  {...describedBy("f-city", showError("city"))}
                />
              </Field>
            </fieldset>

            <fieldset disabled={sending}>
              <legend>
                2. How would you like to help? <span className="pf__req">*</span>
              </legend>
              <p className="pf__hint">
                Pick as many as you like.
                <span className="pf__pointer-only">
                  {" "}
                  To choose more than one in a list, hold Ctrl (Cmd on a Mac) while clicking.
                </span>
              </p>

              {showError("helpWith") && (
                <p id="f-helpWith-error" className="pf__error" role="alert">
                  {showError("helpWith")}
                </p>
              )}

              {HELP_CATEGORIES.map((category, index) => {
                const id = index === 0 ? "f-helpWith" : `f-help-${category.id}`;
                const selected = category.options
                  .map((option) => option.id)
                  .filter((optionId) => values.helpWith.includes(optionId));
                return (
                  <div key={category.id} className="pf__field">
                    <label htmlFor={id}>{category.label}</label>
                    <select
                      id={id}
                      multiple
                      size={category.options.length}
                      value={selected}
                      onChange={(e) => setCategory(category, e)}
                      aria-invalid={Boolean(showError("helpWith"))}
                      aria-describedby={showError("helpWith") ? "f-helpWith-error" : undefined}
                    >
                      {category.options.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    {category.specifics && (
                      <div className="pf__sub">
                        <Field
                          id={`f-${category.specifics.field}`}
                          label="What can you specifically help with?"
                          hint={category.specifics.hint}
                          error={showError(category.specifics.field)}
                        >
                          <textarea
                            id={`f-${category.specifics.field}`}
                            rows={3}
                            value={values[category.specifics.field]}
                            onChange={(e) => set(category.specifics!.field, e.target.value)}
                            onBlur={blur(category.specifics.field)}
                            maxLength={LIMITS.specifics}
                            {...describedBy(
                              `f-${category.specifics.field}`,
                              showError(category.specifics.field),
                              true,
                            )}
                          />
                        </Field>
                      </div>
                    )}
                  </div>
                );
              })}

              <Field
                id="f-otherContribution"
                label="Other Ways to Contribute"
                hint="Anything that doesn't fit the lists above."
                error={showError("otherContribution")}
              >
                <textarea
                  id="f-otherContribution"
                  rows={3}
                  value={values.otherContribution}
                  onChange={(e) => set("otherContribution", e.target.value)}
                  onBlur={blur("otherContribution")}
                  maxLength={LIMITS.otherContribution}
                  {...describedBy("f-otherContribution", showError("otherContribution"), true)}
                />
              </Field>
            </fieldset>

            <fieldset disabled={sending}>
              <legend>3. Your time</legend>

              <Field id="f-commitment" label="How much time can you give?">
                <select
                  id="f-commitment"
                  value={values.commitment}
                  onChange={(e) => set("commitment", e.target.value)}
                >
                  <option value="">-- Select --</option>
                  {COMMITMENTS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                id="f-preferredTimes"
                label="When are you usually free?"
                hint="Pick as many as apply."
              >
                <select
                  id="f-preferredTimes"
                  multiple
                  size={TIMES.length}
                  value={values.preferredTimes}
                  onChange={(e) =>
                    set(
                      "preferredTimes",
                      Array.from(e.target.selectedOptions, (option) => option.value),
                    )
                  }
                  aria-describedby="f-preferredTimes-hint"
                >
                  {TIMES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </Field>
            </fieldset>

            <fieldset disabled={sending}>
              <legend>4. Anything more about you?</legend>

              <Field id="f-message" label="Anything more about you?" error={showError("message")} hideLabel>
                <textarea
                  id="f-message"
                  rows={5}
                  value={values.message}
                  onChange={(e) => set("message", e.target.value)}
                  onBlur={blur("message")}
                  maxLength={LIMITS.message}
                  {...describedBy("f-message", showError("message"))}
                />
              </Field>
            </fieldset>

            {/* Honeypot: off-screen and skipped by keyboard and screen readers. */}
            <div className="pf__hp" aria-hidden>
              <label htmlFor="f-website">Website</label>
              <input
                id="f-website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={values.website}
                onChange={(e) => set("website", e.target.value)}
              />
            </div>

            <div className="pf__field">
              <label className="pf__consent">
                <input
                  id="f-consent"
                  type="checkbox"
                  checked={values.consent}
                  onChange={(e) => set("consent", e.target.checked)}
                  onBlur={blur("consent")}
                  disabled={sending}
                  aria-invalid={Boolean(showError("consent"))}
                  aria-describedby={showError("consent") ? "f-consent-error" : undefined}
                />
                <span>
                  I agree to be contacted by {FOUNDATION.name} about volunteering.{" "}
                  <span className="pf__req">*</span>
                </span>
              </label>
              {showError("consent") && (
                <p id="f-consent-error" className="pf__error">
                  {showError("consent")}
                </p>
              )}
            </div>

            {sendError && (
              <p className="pf__error pf__send-error" role="alert">
                {sendError}
              </p>
            )}

            <p>
              <button type="submit" disabled={sending}>
                {sending ? "Submitting..." : "Submit"}
              </button>
            </p>
            <p className="pf__hint">
              We only use these details to contact you about volunteering.
            </p>
          </form>
        )}

        <p className="pf__foot">
          <a href="/admin">Team sign in</a>
        </p>
      </div>
    </div>
  );
}

/* --- Pieces ------------------------------------------------------------- */

function describedBy(id: string, error: string | undefined, hasHint = false) {
  return {
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? `${id}-error` : hasHint ? `${id}-hint` : undefined,
  };
}

function Field({
  id,
  label,
  required,
  hint,
  error,
  hideLabel,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  hideLabel?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="pf__field">
      <label htmlFor={id} className={hideLabel ? "sr-only" : undefined}>
        {label}
        {required && <span className="pf__req"> *</span>}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="pf__hint">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={`${id}-error`} className="pf__error">
          {error}
        </p>
      )}
    </div>
  );
}
