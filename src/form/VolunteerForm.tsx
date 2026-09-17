import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import Brand from "../components/Brand";
import { AlertIcon, CheckIcon, ChevronDownIcon, LockIcon, LogoMark } from "../components/icons";
import {
  CITY_SUGGESTIONS,
  COMMITMENTS,
  FOUNDATION,
  HELP_CATEGORIES,
  LIMITS,
  TIMES,
  type HelpOption,
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

export default function VolunteerForm() {
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const [phase, setPhase] = useState<Phase>("editing");
  const [sendError, setSendError] = useState<string | null>(null);
  const [thankName, setThankName] = useState("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const doneHeadingRef = useRef<HTMLHeadingElement>(null);

  // Fetch the database code in the background once the page is idle, so the
  // form paints immediately and submitting doesn't wait on a download.
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

  function toggle(key: "helpWith" | "preferredTimes", id: string) {
    setValues((current) => {
      const list = current[key];
      return {
        ...current,
        [key]: list.includes(id) ? list.filter((item) => item !== id) : [...list, id],
      };
    });
  }

  function scrollToCard() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    cardRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
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
      setOpenDropdown(null);
      document.getElementById(`f-${firstInvalid}`)?.focus();
      return;
    }

    setPhase("sending");
    try {
      const { submitVolunteer } = await loadSubmit();
      await submitVolunteer(toInput(values));
      setThankName(firstName);
      setValues(EMPTY_VALUES);
      setOpenDropdown(null);
      setTouched({});
      setAttempted(false);
      setPhase("sent");
      scrollToCard();
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
  const messageLength = values.message.trim().length;

  return (
    <div className="fp">
      <header className="fp__intro">
        <LogoMark className="fp__watermark" />
        <div className="fp__intro-inner">
          <Brand />
          <p className="fp__eyebrow">Volunteer with us</p>
          <h1 className="fp__headline">
            Lend your time. <em>Share your skills.</em>
          </h1>
          <p className="fp__lede">
            Tell us a little about yourself. Our team reads every response and will
            reach out to find the right way for you to help.
          </p>
          <p className="fp__quick">
            <span>About 2 minutes</span>
            <span aria-hidden>·</span>
            <span>No account needed</span>
          </p>

          <ol className="fp__steps">
            <li className="fp__step">
              <span className="fp__step-num">1</span>
              <span>
                <strong>Share your details</strong>
                <span>Takes about two minutes.</span>
              </span>
            </li>
            <li className="fp__step">
              <span className="fp__step-num">2</span>
              <span>
                <strong>We get in touch</strong>
                <span>By phone or email, usually within a few days.</span>
              </span>
            </li>
            <li className="fp__step">
              <span className="fp__step-num">3</span>
              <span>
                <strong>Start making a difference</strong>
                <span>Where your time and skills help most.</span>
              </span>
            </li>
          </ol>

          <p className="fp__tagline">{FOUNDATION.tagline}</p>
        </div>
      </header>

      <main className="fp__main">
        <div className="fp__card" ref={cardRef}>
          {phase === "sent" ? (
            <div className="fp__done" role="status" aria-live="polite">
              <div className="fp__done-mark">
                <CheckIcon />
              </div>
              <h2 ref={doneHeadingRef} tabIndex={-1}>
                Thank you{thankName ? `, ${thankName}` : ""}!
              </h2>
              <p>
                We've received your details. Someone from {FOUNDATION.name} will get in
                touch soon to talk about how you'd like to help.
              </p>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setPhase("editing")}
              >
                Submit another response
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate aria-busy={sending}>
              <div className="fp__cardhead">
                <h2>Volunteer registration</h2>
                <p>
                  Fields marked <span className="req">*</span> are required.
                </p>
              </div>

              <fieldset className="fp__section" disabled={sending}>
                <legend className="fp__legend">
                  <span className="fp__legend-num" aria-hidden>
                    1
                  </span>
                  About you
                </legend>

                <div className="fields">
                  <Field
                    id="f-fullName"
                    label="Full name"
                    required
                    error={showError("fullName")}
                    full
                  >
                    <input
                      id="f-fullName"
                      className="input"
                      value={values.fullName}
                      onChange={(e) => set("fullName", e.target.value)}
                      onBlur={blur("fullName")}
                      autoComplete="name"
                      autoCapitalize="words"
                      enterKeyHint="next"
                      maxLength={LIMITS.name}
                      placeholder="Your full name"
                      {...describedBy("f-fullName", showError("fullName"))}
                    />
                  </Field>

                  <Field
                    id="f-phone"
                    label="Phone / WhatsApp"
                    required
                    error={showError("phone")}
                  >
                    <input
                      id="f-phone"
                      className="input"
                      type="tel"
                      inputMode="tel"
                      value={values.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      onBlur={blur("phone")}
                      autoComplete="tel"
                      enterKeyHint="next"
                      maxLength={LIMITS.phone}
                      placeholder="+91 98765 43210"
                      {...describedBy("f-phone", showError("phone"))}
                    />
                  </Field>

                  <Field id="f-email" label="Email" required error={showError("email")}>
                    <input
                      id="f-email"
                      className="input"
                      type="email"
                      inputMode="email"
                      value={values.email}
                      onChange={(e) => set("email", e.target.value)}
                      onBlur={blur("email")}
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      enterKeyHint="next"
                      maxLength={LIMITS.email}
                      placeholder="you@example.com"
                      {...describedBy("f-email", showError("email"))}
                    />
                  </Field>

                  <Field
                    id="f-city"
                    label="City"
                    optional
                    error={showError("city")}
                    full
                  >
                    <input
                      id="f-city"
                      className="input"
                      list="city-suggestions"
                      value={values.city}
                      onChange={(e) => set("city", e.target.value)}
                      onBlur={blur("city")}
                      autoComplete="address-level2"
                      autoCapitalize="words"
                      enterKeyHint="next"
                      maxLength={LIMITS.city}
                      placeholder="Where are you based?"
                      {...describedBy("f-city", showError("city"))}
                    />
                    <datalist id="city-suggestions">
                      {CITY_SUGGESTIONS.map((city) => (
                        <option key={city} value={city} />
                      ))}
                    </datalist>
                  </Field>
                </div>
              </fieldset>

              <fieldset className="fp__section" disabled={sending}>
                <legend className="fp__legend">
                  <span className="fp__legend-num" aria-hidden>
                    2
                  </span>
                  <span>
                    How would you like to help?
                    <span className="req" aria-hidden>
                      *
                    </span>
                  </span>
                </legend>
                <p className="fp__section-hint">Pick as many as you like.</p>

                <div
                  className={`help-dd${showError("helpWith") ? " help-dd--error" : ""}`}
                  aria-describedby={showError("helpWith") ? "f-helpWith-error" : undefined}
                >
                  {HELP_CATEGORIES.map((category, index) => {
                    const specifics = category.specifics;
                    const picked = category.options.some((o) => values.helpWith.includes(o.id));
                    return (
                      <div key={category.id} className="help-dd__item">
                        <MultiSelectDropdown
                          id={index === 0 ? "f-helpWith" : undefined}
                          label={category.label}
                          options={category.options}
                          selected={values.helpWith}
                          open={openDropdown === category.id}
                          onOpenChange={(open) => setOpenDropdown(open ? category.id : null)}
                          onToggle={(id) => toggle("helpWith", id)}
                          onClear={() =>
                            set(
                              "helpWith",
                              values.helpWith.filter(
                                (id) => !category.options.some((o) => o.id === id),
                              ),
                            )
                          }
                        />

                        {/* Shown once something is picked in this area (or text was already typed). */}
                        {specifics && (picked || values[specifics.field]) && (
                          <div className="help-dd__specifics">
                            <Field
                              id={`f-${specifics.field}`}
                              label="What can you specifically help with?"
                              optional
                              error={showError(specifics.field)}
                              hint={specifics.hint}
                              full
                            >
                              <textarea
                                id={`f-${specifics.field}`}
                                className="textarea help-dd__textarea"
                                value={values[specifics.field]}
                                onChange={(e) => set(specifics.field, e.target.value)}
                                onBlur={blur(specifics.field)}
                                maxLength={LIMITS.specifics}
                                rows={2}
                                {...describedBy(
                                  `f-${specifics.field}`,
                                  showError(specifics.field),
                                  true,
                                )}
                              />
                            </Field>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="fields help-dd__other">
                  <Field
                    id="f-otherContribution"
                    label="Other ways to contribute"
                    optional
                    error={showError("otherContribution")}
                    hint="Anything that doesn't fit the lists above."
                    full
                  >
                    <textarea
                      id="f-otherContribution"
                      className="textarea help-dd__textarea"
                      value={values.otherContribution}
                      onChange={(e) => set("otherContribution", e.target.value)}
                      onBlur={blur("otherContribution")}
                      maxLength={LIMITS.otherContribution}
                      rows={2}
                      {...describedBy(
                        "f-otherContribution",
                        showError("otherContribution"),
                        true,
                      )}
                    />
                  </Field>
                </div>

                {showError("helpWith") && (
                  <p id="f-helpWith-error" className="field__error help__error">
                    <AlertIcon />
                    {showError("helpWith")}
                  </p>
                )}
              </fieldset>

              <fieldset className="fp__section" disabled={sending}>
                <legend className="fp__legend">
                  <span className="fp__legend-num" aria-hidden>
                    3
                  </span>
                  Your time
                </legend>
                <p className="fp__section-hint">A rough idea is fine.</p>

                <ChoiceGroup label="How much time can you give?">
                  {COMMITMENTS.map((item) => (
                    <Chip
                      key={item.id}
                      type="radio"
                      name="commitment"
                      label={item.label}
                      checked={values.commitment === item.id}
                      onChange={() => set("commitment", item.id)}
                    />
                  ))}
                </ChoiceGroup>

                <ChoiceGroup label="When are you usually free?">
                  {TIMES.map((item) => (
                    <Chip
                      key={item.id}
                      type="checkbox"
                      name="preferredTimes"
                      label={item.label}
                      checked={values.preferredTimes.includes(item.id)}
                      onChange={() => toggle("preferredTimes", item.id)}
                    />
                  ))}
                </ChoiceGroup>
              </fieldset>

              <fieldset className="fp__section" disabled={sending}>
                <legend className="fp__legend">
                  <span className="fp__legend-num" aria-hidden>
                    4
                  </span>
                  Anything more about you?
                </legend>
                <p className="fp__section-hint">
                  Optional. Your experience, the languages you speak, or why you'd like to
                  volunteer.
                </p>

                <div className="fields">
                  <Field
                    id="f-message"
                    label="Anything more about you"
                    hideLabel
                    error={showError("message")}
                    hint={`${messageLength} / ${LIMITS.message}`}
                    full
                  >
                    <textarea
                      id="f-message"
                      className="textarea"
                      value={values.message}
                      onChange={(e) => set("message", e.target.value)}
                      onBlur={blur("message")}
                      maxLength={LIMITS.message}
                      rows={4}
                      placeholder="Tell us a little about yourself…"
                      {...describedBy("f-message", showError("message"), true)}
                    />
                  </Field>
                </div>

                {/* Honeypot: off-screen and skipped by keyboard and screen readers. */}
                <div className="fp__hp" aria-hidden>
                  <label htmlFor="f-website">Website</label>
                  <input
                    id="f-website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={values.website}
                    onChange={(e) => set("website", e.target.value)}
                  />
                </div>

                <label
                  className={`fp__consent${showError("consent") ? " fp__consent--error" : ""}`}
                >
                  <input
                    id="f-consent"
                    type="checkbox"
                    checked={values.consent}
                    onChange={(e) => set("consent", e.target.checked)}
                    onBlur={blur("consent")}
                    aria-invalid={Boolean(showError("consent"))}
                    aria-describedby={showError("consent") ? "f-consent-error" : undefined}
                  />
                  <span>
                    I agree to be contacted by {FOUNDATION.name} about volunteering.
                    <span className="req" aria-hidden>
                      *
                    </span>
                  </span>
                </label>
                {showError("consent") && (
                  <p id="f-consent-error" className="field__error fp__consent-error">
                    <AlertIcon />
                    {showError("consent")}
                  </p>
                )}
              </fieldset>

              <div className="fp__submit">
                {sendError && (
                  <div className="notice notice--error" role="alert">
                    <AlertIcon />
                    <span>{sendError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn--primary btn--lg btn--block"
                  disabled={sending}
                  aria-busy={sending}
                >
                  {sending ? (
                    <>
                      <span className="spinner" aria-hidden />
                      Sending…
                    </>
                  ) : (
                    "Send my details"
                  )}
                </button>

                <p className="fp__privacy">
                  <LockIcon />
                  We only use these details to contact you about volunteering.
                </p>
              </div>
            </form>
          )}
        </div>

        <footer className="fp__foot">
          <span>© {new Date().getFullYear()} {FOUNDATION.name}</span>
          <a href="/admin">Team sign in</a>
        </footer>
      </main>
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
  optional,
  hideLabel,
  error,
  hint,
  full,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  /** Keep the label for screen readers when a visible heading already says it. */
  hideLabel?: boolean;
  error?: string;
  hint?: string;
  full?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`field${full ? " field--full" : ""}`}>
      <label className={hideLabel ? "sr-only" : "label"} htmlFor={id}>
        {label}
        {required && (
          <span className="req" aria-hidden>
            *
          </span>
        )}
        {optional && <span className="optional">(optional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="field__error">
          <AlertIcon />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="field__hint fp__counter">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/**
 * A dropdown that allows several choices. Closed, it reads like a normal select
 * and shows what's been picked; open, it lists the options with checkboxes.
 * It closes on Done, Escape, or a click or tap anywhere outside it.
 */
function MultiSelectDropdown({
  id,
  label,
  options,
  selected,
  open,
  onOpenChange,
  onToggle,
  onClear,
}: {
  id?: string;
  label: string;
  options: HelpOption[];
  selected: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggle: (optionId: string) => void;
  onClear: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const labelId = useId();
  const valueId = useId();
  const panelId = useId();
  const chosen = options.filter((option) => selected.includes(option.id));

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  return (
    <div
      ref={rootRef}
      className={`dd${open ? " dd--open" : ""}${chosen.length ? " dd--filled" : ""}`}
    >
      <span id={labelId} className="label dd__label">
        {label}
      </span>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className="dd__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        aria-labelledby={`${labelId} ${valueId}`}
        onClick={() => onOpenChange(!open)}
      >
        <span id={valueId} className="dd__value">
          {chosen.length ? chosen.map((option) => option.label).join(", ") : "Choose any that apply"}
        </span>
        {chosen.length > 0 && (
          <span className="dd__count" aria-hidden>
            {chosen.length}
          </span>
        )}
        <ChevronDownIcon className="dd__chevron" />
      </button>

      {open && (
        <div id={panelId} className="dd__panel" role="group" aria-labelledby={labelId}>
          <ul className="dd__list">
            {options.map((option) => {
              const checked = selected.includes(option.id);
              return (
                <li key={option.id}>
                  <label className={`dd__option${checked ? " dd__option--checked" : ""}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(option.id)}
                    />
                    <span className="dd__box" aria-hidden>
                      <CheckIcon />
                    </span>
                    <span className="dd__option-label">{option.label}</span>
                  </label>
                </li>
              );
            })}
          </ul>
          <div className="dd__footer">
            <button
              type="button"
              className="btn btn--quiet"
              onClick={onClear}
              disabled={chosen.length === 0}
            >
              Clear
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                onOpenChange(false);
                triggerRef.current?.focus();
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ChoiceGroup({ label, children }: { label: string; children: ReactNode }) {
  const id = useId();
  return (
    <div className="fp__choice" role="group" aria-labelledby={id}>
      <p id={id} className="label">
        {label}
      </p>
      <div className="chips">{children}</div>
    </div>
  );
}

function Chip({
  type,
  name,
  label,
  checked,
  onChange,
}: {
  type: "checkbox" | "radio";
  name: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="chip">
      <input type={type} name={name} checked={checked} onChange={onChange} />
      <span>
        <CheckIcon />
        {label}
      </span>
    </label>
  );
}
