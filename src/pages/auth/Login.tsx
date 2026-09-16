import { useState } from "react";
import { Link } from "react-router-dom";
import AuthShell, { Notice } from "../../components/AuthShell";
import { Field } from "../../components/ui";
import { signIn } from "../../data/api";

const MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "The email address or password is incorrect.",
  "auth/too-many-requests": "Too many attempts. Wait a moment before trying again.",
  "auth/network-request-failed": "Firebase could not be reached. Check your connection and try again.",
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setBusy(true);
    try {
      await signIn(email, password);
    } catch (err) {
      const code = (err as { code?: string }).code ?? (err as Error).message;
      setError(MESSAGES[code] ?? "Something went wrong signing in.");
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Sign in"
      lede="Welcome back. Sign in to see your volunteering commitments."
      footer={
        <>
          Don't have an account yet?{" "}
          <Link to="/request-account">Request to volunteer</Link>
        </>
      }
    >
      <form className="auth__fields" onSubmit={submit} noValidate>
        {error && <Notice kind="error">{error}</Notice>}

        <Field label="Email Address" required htmlFor="email">
          <input
            id="email"
            type="email"
            className="input"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError(null);
            }}
            placeholder="you@domain.com"
            autoComplete="email"
            autoFocus
          />
        </Field>

        <Field label="Password" required htmlFor="password">
          <input
            id="password"
            type="password"
            className="input"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError(null);
            }}
            placeholder="Your password"
            autoComplete="current-password"
          />
        </Field>

        <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
          {busy ? "Signing in..." : "Sign in"}
        </button>

        <Notice kind="info">
          Sign-in is protected by Firebase Authentication. Account access is
          granted after a foundation administrator approves your request.
        </Notice>
      </form>
    </AuthShell>
  );
}
