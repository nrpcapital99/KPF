import { useState, type FormEvent } from "react";
import Brand from "../components/Brand";
import { AlertIcon, CheckIcon, EyeIcon, EyeOffIcon } from "../components/icons";
import { describeAuthError, resetPassword, signIn } from "./data";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(describeAuthError(err));
      setBusy(false);
    }
  }

  async function onForgot() {
    setError(null);
    setInfo(null);
    if (!email.trim()) {
      setError("Enter your email above, then tap “Forgot password?” again.");
      document.getElementById("si-email")?.focus();
      return;
    }
    try {
      await resetPassword(email);
    } catch {
      // Don't reveal whether the address has an account.
    }
    setInfo(`If ${email.trim()} has a team account, a reset link is on its way.`);
  }

  return (
    <div className="si">
      <div className="si__card">
        <div className="si__brand">
          <Brand href="/" />
        </div>
        <h1>Team sign in</h1>
        <p className="si__lede">See and manage volunteer responses.</p>

        <form className="si__form" onSubmit={onSubmit} noValidate>
          {error && (
            <div className="notice notice--error" role="alert">
              <AlertIcon />
              <span>{error}</span>
            </div>
          )}
          {info && (
            <div className="notice notice--ok" role="status">
              <CheckIcon />
              <span>{info}</span>
            </div>
          )}

          <div className="field">
            <label className="label" htmlFor="si-email">
              Email
            </label>
            <input
              id="si-email"
              className="input"
              type="email"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
          </div>

          <div className="field">
            <div className="si__label-row">
              <label className="label" htmlFor="si-password">
                Password
              </label>
              <button type="button" className="si__link" onClick={onForgot}>
                Forgot password?
              </button>
            </div>
            <div className="si__password">
              <input
                id="si-password"
                className="input"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
              />
              <button
                type="button"
                className="si__reveal"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn--primary btn--lg btn--block"
            disabled={busy}
            aria-busy={busy}
          >
            {busy ? (
              <>
                <span className="spinner" aria-hidden /> Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <a className="si__back" href="/">
          ← Back to the volunteer form
        </a>
      </div>
    </div>
  );
}
