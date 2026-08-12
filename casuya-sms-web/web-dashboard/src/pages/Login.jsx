import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api, setSession } from "../lib/api";
import AuthShell from "../components/AuthShell";

const MAIL = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const LOCK = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EYE = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EYE_OFF = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export default function Login() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isLogin = mode === "login";

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post(
        isLogin ? "/api/auth/login" : "/api/auth/register",
        { email, password }
      );
      setSession(res.data.token, res.data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(isLogin ? "register" : "login");
    setError("");
  };

  return (
    <AuthShell>
      <div className="auth-card">
        <h2 className="auth-title">{isLogin ? "Welcome back" : "Create your account"}</h2>
        <p className="auth-sub">
          {isLogin ? "Sign in to your SMS gateway." : "Start sending SMS in under two minutes."}
        </p>

        <form onSubmit={submit} className="auth-form" noValidate>
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
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
              />
            </div>
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
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? EYE_OFF : EYE}
              </button>
            </div>
            {!isLogin && <p className="auth-hint">Min 8 characters with uppercase, lowercase &amp; a number.</p>}
          </div>

          {error && <div className="auth-error" role="alert">{error}</div>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="auth-divider"><span>or</span></div>

        <button type="button" className="auth-switch" onClick={switchMode}>
          {isLogin ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>

        <Link to="/" className="auth-back">&larr; Back to Home</Link>
      </div>
    </AuthShell>
  );
}