import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { validateEmail, extractError } from "../lib/validation";
import AuthShell from "../components/AuthShell";

const MAIL = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [resetUrl, setResetUrl] = useState("");
  const navigate = useNavigate();

  const submitGuard = useRef(false);
  const mountedRef = useRef(true);
  const abortRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const handleEmailChange = useCallback((e) => {
    setEmail(e.target.value);
    setFieldError("");
    setError("");
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (submitGuard.current) return;

      const emailError = validateEmail(email);
      if (emailError) {
        setFieldError(emailError);
        return;
      }

      submitGuard.current = true;
      setLoading(true);
      setError("");
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await api.post(
          "/api/auth/forgot-password",
          { email: email.trim().toLowerCase() },
          { signal: controller.signal }
        );
        if (!mountedRef.current) return;
        setDone(true);
        if (res.data.resetUrl) setResetUrl(res.data.resetUrl);
      } catch (err) {
        if (!mountedRef.current || err?.code === "ERR_CANCELED") return;
        setError(extractError(err));
      } finally {
        submitGuard.current = false;
        if (mountedRef.current) setLoading(false);
      }
    },
    [email]
  );

  if (done) {
    return (
      <AuthShell>
        <div className="auth-card">
          <div className="auth-status-icon auth-status-ok">&#10003;</div>
          <h2 className="auth-title">Check your email</h2>
          <p className="auth-sub">
            If an account exists with <strong>{email}</strong>, a password reset link has been generated.
          </p>
          {resetUrl && (
            <div className="auth-dev-box">
              <div className="auth-dev-label">Development mode — reset link:</div>
              <a href={resetUrl} className="auth-dev-link">{resetUrl}</a>
            </div>
          )}
          <button type="button" className="auth-submit" onClick={() => navigate("/login")}>
            Back to Login
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="auth-card">
        <h2 className="auth-title">Forgot password</h2>
        <p className="auth-sub">Enter your email and we'll generate a reset link for you.</p>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="fp-email">Email address</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">{MAIL}</span>
              <input
                id="fp-email"
                type="email"
                className="auth-input"
                placeholder="you@example.com"
                value={email}
                onChange={handleEmailChange}
                disabled={loading}
                required
                autoFocus
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                spellCheck="false"
                aria-invalid={Boolean(fieldError)}
                aria-describedby={fieldError ? "fp-email-error" : undefined}
              />
            </div>
            {fieldError && (
              <p id="fp-email-error" className="auth-error-line" role="alert">{fieldError}</p>
            )}
          </div>

          {error && (
            <div className="auth-error" role="alert">{error}</div>
          )}

          <button type="submit" className="auth-submit" disabled={loading} aria-busy={loading}>
            {loading && <span className="auth-spinner" aria-hidden="true" />}
            {loading ? "Sending…" : "Send Reset Link"}
          </button>
        </form>

        <button type="button" className="auth-switch" onClick={() => navigate("/login")} disabled={loading}>
          &larr; Back to Login
        </button>
      </div>
    </AuthShell>
  );
}
