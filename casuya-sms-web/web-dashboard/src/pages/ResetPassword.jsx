import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import {
  validatePassword,
  passwordScore,
  STRENGTH_LABELS,
  STRENGTH_CLASSES,
  extractError,
} from "../lib/validation";
import AuthShell from "../components/AuthShell";

const LOCK = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
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

  const strength = useMemo(() => passwordScore(password), [password]);

  const handlePasswordChange = useCallback((e) => {
    setPassword(e.target.value);
    setError("");
    setFieldErrors((prev) => (prev.password ? { ...prev, password: "" } : prev));
  }, []);

  const handleConfirmChange = useCallback((e) => {
    setConfirm(e.target.value);
    setError("");
    setFieldErrors((prev) => (prev.confirm ? { ...prev, confirm: "" } : prev));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (submitGuard.current) return;

      const passwordError = validatePassword(password, true);
      const confirmError = password && confirm !== password ? "Passwords do not match." : "";
      if (passwordError || confirmError) {
        setFieldErrors({ password: passwordError, confirm: confirmError });
        return;
      }

      submitGuard.current = true;
      setLoading(true);
      setError("");
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await api.post(
          "/api/auth/reset-password",
          { token, password },
          { signal: controller.signal }
        );
        if (!mountedRef.current) return;
        setDone(true);
      } catch (err) {
        if (!mountedRef.current || err?.code === "ERR_CANCELED") return;
        setError(extractError(err));
      } finally {
        submitGuard.current = false;
        if (mountedRef.current) setLoading(false);
      }
    },
    [token, password, confirm]
  );

  if (!token) {
    return (
      <AuthShell>
        <div className="auth-card">
          <div className="auth-status-icon auth-status-error">&#10007;</div>
          <h2 className="auth-title">Invalid link</h2>
          <p className="auth-sub">This password reset link is invalid or missing a token.</p>
          <button type="button" className="auth-submit" onClick={() => navigate("/forgot-password")}>
            Request a New Link
          </button>
        </div>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell>
        <div className="auth-card">
          <div className="auth-status-icon auth-status-ok">&#10003;</div>
          <h2 className="auth-title">Password reset</h2>
          <p className="auth-sub">Your password has been successfully reset.</p>
          <button type="button" className="auth-submit" onClick={() => navigate("/login")}>
            Go to Login
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="auth-card">
        <h2 className="auth-title">Reset password</h2>
        <p className="auth-sub">Choose a new password for your account.</p>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="rp-pass">New password</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">{LOCK}</span>
              <input
                id="rp-pass"
                type="password"
                className="auth-input"
                placeholder="Min 8 chars, upper + lower + number"
                value={password}
                onChange={handlePasswordChange}
                disabled={loading}
                required
                minLength={8}
                autoFocus
                autoComplete="new-password"
                autoCapitalize="none"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? "rp-pass-error" : undefined}
              />
            </div>
            {fieldErrors.password && (
              <p id="rp-pass-error" className="auth-error-line" role="alert">{fieldErrors.password}</p>
            )}
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
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="rp-confirm">Confirm password</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">{LOCK}</span>
              <input
                id="rp-confirm"
                type="password"
                className="auth-input"
                placeholder="Re-enter your new password"
                value={confirm}
                onChange={handleConfirmChange}
                disabled={loading}
                required
                minLength={8}
                autoComplete="new-password"
                autoCapitalize="none"
                aria-invalid={Boolean(fieldErrors.confirm)}
                aria-describedby={fieldErrors.confirm ? "rp-confirm-error" : undefined}
              />
            </div>
            {fieldErrors.confirm && (
              <p id="rp-confirm-error" className="auth-error-line" role="alert">{fieldErrors.confirm}</p>
            )}
          </div>

          {error && (
            <div className="auth-error" role="alert">{error}</div>
          )}

          <button type="submit" className="auth-submit" disabled={loading} aria-busy={loading}>
            {loading && <span className="auth-spinner" aria-hidden="true" />}
            {loading ? "Resetting…" : "Reset Password"}
          </button>
        </form>

        <button type="button" className="auth-switch" onClick={() => navigate("/login")} disabled={loading}>
          &larr; Back to Login
        </button>
      </div>
    </AuthShell>
  );
}