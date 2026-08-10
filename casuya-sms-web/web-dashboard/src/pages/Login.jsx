import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api, setSession } from "../lib/api";

export default function Login() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post(
        mode === "login" ? "/api/auth/login" : "/api/auth/register",
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

  return (
    <div className="fp-root">
      <div className="fp-card">
        <h1 className="fp-title">casuya-sms</h1>
        <p className="fp-desc">
          {mode === "login" ? "Sign in to your gateway" : "Create a gateway account"}
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
          <input
            type="password"
            placeholder={mode === "login" ? "password" : "password (min 6 chars)"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="fp-input"
            required
            minLength={6}
          />
          {error && <div className="fp-error">{error}</div>}
          <button type="submit" className="fp-btn fp-btn-primary" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}
          </button>
        </form>
        {mode === "login" && (
          <button className="fp-link" onClick={() => navigate("/forgot-password")}>
            Forgot password?
          </button>
        )}
        <button className="fp-link" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
          {mode === "login" ? "Need an account? Register" : "Have an account? Login"}
        </button>
        <Link to="/" className="fp-link" style={{ marginTop: 8, textDecoration: "none" }}>
          Back to Home
        </Link>
      </div>
    </div>
  );
}
