import { useState } from "react";
import AuthShell, { Notice } from "../../components/AuthShell";
import { Field, Select } from "../../components/ui";
import { bootstrapFirstAdmin, listLocations } from "../../data/api";

/**
 * Shown only when the directory is completely empty. The first account has to
 * be an admin — there is nobody yet who could approve it. Once it exists this
 * screen is unreachable.
 */
export default function FirstRun() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    location: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
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
    if (form.password.length < 8) {
      next.password = "Use at least 8 characters.";
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await bootstrapFirstAdmin(form);
    } catch (err) {
      setErrors({ form: (err as Error).message });
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Set up the foundation"
      lede="Create the first administrator account. You'll be able to approve volunteers and open up volunteering slots from here."
    >
      <form className="auth__fields" onSubmit={submit} noValidate>
        {errors.form && <Notice kind="error">{errors.form}</Notice>}

        <Notice kind="info">
          This screen appears once. The first account is an administrator
          because there is nobody yet who could approve it.
        </Notice>

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

        <Field label="Password" required htmlFor="password" error={errors.password}>
          <input
            id="password"
            type="password"
            className="input"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            placeholder="At least 8 characters"
            aria-invalid={Boolean(errors.password)}
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

        <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
          {busy ? "Creating..." : "Create admin account"}
        </button>
      </form>
    </AuthShell>
  );
}
