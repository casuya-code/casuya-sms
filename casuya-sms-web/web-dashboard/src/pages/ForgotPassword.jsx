import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import AuthShell from "../components/AuthShell";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [resetUrl, setResetUrl] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/auth/forgot-password", { email });
      setDone(true);
      if (res.data.resetUrl) {
        setResetUrl(res.data.resetUrl);
      }
    } catch (err) {
      setError(err.response?.data?.error || "something went wrong");
    } finally {
      setLoading(false);
    }
  };

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

        <form onSubmit={submit} className="auth-form" noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="fp-email">Email address</label>
            <div className="auth-input-wrap">
              <input
                id="fp-email"
                type="email"
                className="auth-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
              />
            </div>
          </div>

          {error && <div className="auth-error" role="alert">{error}</div>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Please wait…" : "Send Reset Link"}
          </button>
        </form>

        <button type="button" className="auth-switch" onClick={() => navigate("/login")}>
          &larr; Back to Login
        </button>
      </div>
    </AuthShell>
  );
}