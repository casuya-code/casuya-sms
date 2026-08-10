import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

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
      <div className="fp-root">
        <div className="fp-card">
          <div className="fp-icon">&#10003;</div>
          <h1 className="fp-title">Check Your Email</h1>
          <p className="fp-desc">
            If an account exists with <strong>{email}</strong>, a password reset link has been generated.
          </p>
          {resetUrl && (
            <div className="fp-dev-box">
              <div className="fp-dev-label">Development mode — reset link:</div>
              <a href={resetUrl} className="fp-dev-link">{resetUrl}</a>
            </div>
          )}
          <button className="fp-btn fp-btn-primary" onClick={() => navigate("/login")}>
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fp-root">
      <div className="fp-card">
        <h1 className="fp-title">Forgot Password</h1>
        <p className="fp-desc">
          Enter your email address and we'll generate a reset link for you.
        </p>
        <form onSubmit={submit} className="fp-form">
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="fp-input"
            required
            autoFocus
          />
          {error && <div className="fp-error">{error}</div>}
          <button type="submit" className="fp-btn fp-btn-primary" disabled={loading}>
            {loading ? "Please wait..." : "Send Reset Link"}
          </button>
        </form>
        <button className="fp-link" onClick={() => navigate("/login")}>
          Back to Login
        </button>
      </div>
    </div>
  );
}
