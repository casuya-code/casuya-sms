import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import AuthShell from "../components/AuthShell";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/auth/reset-password", { token, password });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error || "something went wrong");
    } finally {
      setLoading(false);
    }
  };

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

        <form onSubmit={submit} className="auth-form" noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="rp-pass">New password</label>
            <input
              id="rp-pass"
              type="password"
              className="auth-input"
              placeholder="Min 8 chars, upper + lower + number"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoFocus
              autoComplete="new-password"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="rp-confirm">Confirm password</label>
            <input
              id="rp-confirm"
              type="password"
              className="auth-input"
              placeholder="Re-enter your new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          {error && <div className="auth-error" role="alert">{error}</div>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Please wait…" : "Reset Password"}
          </button>
        </form>

        <button type="button" className="auth-switch" onClick={() => navigate("/login")}>
          &larr; Back to Login
        </button>
      </div>
    </AuthShell>
  );
}