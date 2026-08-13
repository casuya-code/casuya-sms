import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api, setSession } from "../lib/api";
import {
  validateEmail,
  validatePassword,
  passwordScore,
  STRENGTH_LABELS,
  STRENGTH_CLASSES,
  extractError,
} from "../lib/validation";
import AuthShell from "../components/AuthShell";

const MAIL = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const LOCK = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EYE = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EYE_OFF = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const isLogin = mode === "login";
  const strength = useMemo(() => passwordScore(password), [password]);

  const handleEmailChange = useCallback((e) => {
    setEmail(e.target.value);
    setServerError("");
    setFieldErrors((prev) => (prev.email ? { ...prev, email: "" } : prev));
  }, []);

  const handlePasswordChange = useCallback((e) => {
    setPassword(e.target.value);
    setServerError("");
    setFieldErrors((prev) => (prev.password ? { ...prev, password: "" } : prev));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (submitGuard.current) return;

      const emailError = validateEmail(email);
      const passwordError = validatePassword(password, !isLogin);
      if (emailError || passwordError) {
        setFieldErrors({ email: emailError, password: passwordError });
        return;
      }

      submitGuard.current = true;
      setSubmitting(true);
      setServerError("");
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await api.post(
          isLogin ? "/api/auth/login" : "/api/auth/register",
          { email: email.trim().toLowerCase(), password },
          { signal: controller.signal }
        );
        if (!mountedRef.current) return;
        setSession(res.data.token, res.data.user);
        const from = location.state?.from?.pathname || "/dashboard";
        navigate(from, { replace: true });
      } catch (err) {
        if (!mountedRef.current || err?.code === "ERR_CANCELED") return;
        setServerError(extractError(err));
      } finally {
        submitGuard.current = false;
        if (mountedRef.current) setSubmitting(false);
      }
    },
    [email, password, isLogin, location.state, navigate]
  );

  const switchMode = useCallback(() => {
    setMode((m) => (m === "login" ? "register" : "login"));
    setPassword("");
    setShowPassword(false);
    setServerError("");
    setFieldErrors({});
  }, []);

  const togglePassword = useCallback(() => setShowPassword((v) => !v), []);

  const buttonLabel = isLogin ? (submitting ? "Signing in…" : "Sign in") : submitting ? "Creating account…" : "Create account";

  return (
    <AuthShell>
      <div className="auth-card">
        <h2 className="auth-title">{isLogin ? "Welcome back" : "Create your account"}</h2>
        <p className="auth-sub">
          {isLogin ? "Sign in to your SMS gateway." : "Start sending SMS in under two minutes."}
        </p>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-email">Email address</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">{MAIL}</span>
              <input
                id="auth-email"
                type="email"
                className="auth-input"
                placeholder="you@example.com"
                value={email}
                onChange={handleEmailChange}
                disabled={submitting}
                required
                autoFocus
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                spellCheck="false"
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "auth-email-error" : undefined}
              />
            </div>
            {fieldErrors.email && (
              <p id="auth-email-error" className="auth-error-line" role="alert">{fieldErrors.email}</p>
            )}
          </div>

          <div className="auth-field">
            <div className="auth-label-row">
              <label className="auth-label" htmlFor="auth-password">Password</label>
              {isLogin && (
                <button type="button" className="auth-inline-link" onClick={() => navigate("/forgot-password")}>
                  Forgot password?
                </button>
              )}
            </div>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">{LOCK}</span>
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                className="auth-input auth-input-pr"
                placeholder={isLogin ? "Enter your password" : "Create a strong password"}
                value={password}
                onChange={handlePasswordChange}
                disabled={submitting}
                required
                minLength={8}
                autoComplete={isLogin ? "current-password" : "new-password"}
                autoCapitalize="none"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? "auth-password-error" : undefined}
              />
              <button
                type="button"
                className="auth-eye"
                onClick={togglePassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? EYE_OFF : EYE}
              </button>
            </div>
            {fieldErrors.password && (
              <p id="auth-password-error" className="auth-error-line" role="alert">{fieldErrors.password}</p>
            )}
            {!isLogin && (
              <div className="auth-strength" aria-hidden="true">
                <div className="auth-strength-bars">
                  {[1, 2, 3, 4].map((i) => (
                    <span key={i} className={i <= strength ? STRENGTH_CLASSES[strength] : ""} />
                  ))}
                </div>
                {password && (
                  <span className="auth-strength-label">{STRENGTH_LABELS[strength]}</span>
                )}
              </div>
            )}
          </div>

          {serverError && (
            <div className="auth-error" role="alert">{serverError}</div>
          )}

          <button type="submit" className="auth-submit" disabled={submitting} aria-busy={submitting}>
            {submitting && <span className="auth-spinner" aria-hidden="true" />}
            {buttonLabel}
          </button>
        </form>

        <div className="auth-divider"><span>or</span></div>

        <button type="button" className="auth-switch" onClick={switchMode} disabled={submitting}>
          {isLogin ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>

        <Link to="/" className="auth-back">&larr; Back to Home</Link>
      </div>
    </AuthShell>
  );
}
