import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";

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
      <div className="fp-root">
        <div className="fp-card">
          <div className="fp-icon fp-icon-error">&#10007;</div>
          <h1 className="fp-title">Invalid Link</h1>
          <p className="fp-desc">This password reset link is invalid or missing a token.</p>
          <button className="fp-btn fp-btn-primary" onClick={() => navigate("/forgot-password")}>
            Request a New Link
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="fp-root">
        <div className="fp-card">
          <div className="fp-icon">&#10003;</div>
          <h1 className="fp-title">Password Reset</h1>
          <p className="fp-desc">Your password has been successfully reset.</p>
          <button className="fp-btn fp-btn-primary" onClick={() => navigate("/login")}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fp-root">
      <div className="fp-card">
        <h1 className="fp-title">Reset Password</h1>
        <p className="fp-desc">Enter your new password below.</p>
        <form onSubmit={submit} className="fp-form">
          <input
            type="password"
            placeholder="new password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="fp-input"
            required
            minLength={6}
            autoFocus
          />
          <input
            type="password"
            placeholder="confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="fp-input"
            required
            minLength={6}
          />
          {error && <div className="fp-error">{error}</div>}
          <button type="submit" className="fp-btn fp-btn-primary" disabled={loading}>
            {loading ? "Please wait..." : "Reset Password"}
          </button>
        </form>
        <button className="fp-link" onClick={() => navigate("/login")}>
          Back to Login
        </button>
      </div>
    </div>
  );
}
