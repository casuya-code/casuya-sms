import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";

const STATS = [
  { value: "10K+", label: "Developers" },
  { value: "99.9%", label: "Uptime" },
  { value: "0", label: "Per-Message Fees" },
  { value: "MIT", label: "Licensed" },
];

const FEATURES = [
  {
    icon: "phone",
    title: "Your Own Phone",
    desc: "Use your Android device as an SMS gateway. No third-party services, no per-message fees.",
  },
  {
    icon: "bulk",
    title: "Bulk SMS",
    desc: "Upload a CSV and send personalized messages to hundreds of recipients at once.",
  },
  {
    icon: "template",
    title: "Templates",
    desc: "Reusable message templates with variables. Perfect for report cards, alerts, and notifications.",
  },
  {
    icon: "api",
    title: "REST API",
    desc: "Integrate SMS into your own apps with a simple API key and a POST request.",
  },
  {
    icon: "track",
    title: "Delivery Tracking",
    desc: "Track every message with real-time status updates and a complete SMS log.",
  },
  {
    icon: "secure",
    title: "Secure & Private",
    desc: "Your data stays on your server. Self-hostable, open-source, and fully under your control.",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Install the App",
    desc: "Download the Android app and grant SMS permissions.",
  },
  {
    num: "02",
    title: "Connect Your Device",
    desc: "Open the app — the server mints your Device ID and API key automatically.",
  },
  {
    num: "03",
    title: "Start Sending",
    desc: "Send SMS from the dashboard, the REST API, or upload a CSV for bulk delivery.",
  },
];

const ICONS = {
  phone: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
  bulk: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  template: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  api: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  track: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  secure: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
};

const CODE_SNIPPET = `curl -X POST https://your-server.com/api/v1/send \\
  -H "X-API-KEY: casuya_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"to": "+1234567890", "message": "Hello!"}'`;

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

export default function Home() {
  const navigate = useNavigate();
  const [heroRef, heroVis] = useInView(0.1);
  const [featRef, featVis] = useInView(0.1);
  const [stepRef, stepVis] = useInView(0.1);
  const [apiRef, apiVis] = useInView(0.1);
  const [ctaRef, ctaVis] = useInView(0.1);

  return (
    <div className="hx-root">
      {/* ── NAV ────────────────────────────────────────────── */}
      <nav className="hx-nav">
        <div className="hx-nav-inner">
          <div className="hx-nav-brand">
            <span className="hx-nav-logo">CS</span>
            <span className="hx-nav-name">casuya-sms</span>
          </div>
          <div className="hx-nav-links">
            <a href="https://github.com/casuya-code/casuya-sms" target="_blank" rel="noreferrer" className="hx-nav-gh">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.303 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              GitHub
            </a>
            <button onClick={() => navigate("/login")} className="hx-nav-login">Login</button>
            <button onClick={() => navigate("/register")} className="hx-nav-cta">Get Started</button>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="hx-hero" ref={heroRef}>
        <div className={`hx-hero-glow ${heroVis ? "is-visible" : ""}`} />
        <div className={`hx-hero-inner ${heroVis ? "is-visible" : ""}`}>
          
          <h1 className="hx-hero-title">
            Turn Your Phone Into an
            <br />
            <span className="hx-hero-gradient">Enterprise SMS Gateway</span>
          </h1>
          <p className="hx-hero-desc">
            Send and receive SMS using your own Android device. No third-party services, no per-message fees. Self-hosted and fully under your control.
          </p>
          <div className="hx-hero-actions">
            <button onClick={() => navigate("/register")} className="hx-btn-cta">
              Start Sending Free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
            <a href="https://github.com/casuya-code/casuya-sms" target="_blank" rel="noreferrer" className="hx-btn-ghost">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.303 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              View on GitHub
            </a>
          </div>
          <div className="hx-hero-points">
            <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> No per-message fees</span>
            <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> Self-hosted data</span>
            <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> Setup in minutes</span>
          </div>
        </div>

        {/* Code preview */}
        <div className={`hx-hero-code ${heroVis ? "is-visible" : ""}`}>
          <div className="hx-code-header">
            <div className="hx-code-dots">
              <span /><span /><span />
            </div>
            <span className="hx-code-label">Send an SMS via REST API</span>
          </div>
          <pre className="hx-code-body"><code>{CODE_SNIPPET}</code></pre>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────── */}
      <section className="hx-stats">
        <div className="hx-stats-inner">
          {STATS.map((s) => (
            <div key={s.label} className="hx-stat">
              <div className="hx-stat-value">{s.value}</div>
              <div className="hx-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section className="hx-section hx-section-dark" ref={stepRef}>
        <div className={`hx-container ${stepVis ? "is-visible" : ""}`}>
          <p className="hx-eyebrow">Get started in three steps</p>
          <h2 className="hx-section-title">How It Works</h2>
          <div className="hx-steps">
            {STEPS.map((s, i) => (
              <div key={s.num} className="hx-step" style={{ animationDelay: `${i * 0.12}s` }}>
                <div className="hx-step-num">{s.num}</div>
                <div className="hx-step-line" />
                <div className="hx-step-content">
                  <div className="hx-step-title">{s.title}</div>
                  <div className="hx-step-desc">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section className="hx-section hx-section-light" ref={featRef}>
        <div className={`hx-container ${featVis ? "is-visible" : ""}`}>
          <p className="hx-eyebrow">Everything included</p>
          <h2 className="hx-section-title">Everything You Need</h2>
          <div className="hx-features">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="hx-feature-card" style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="hx-feature-icon">{ICONS[f.icon]}</div>
                <div className="hx-feature-title">{f.title}</div>
                <div className="hx-feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── API SHOWCASE ─────────────────────────────────────── */}
      <section className="hx-section hx-section-dark" ref={apiRef}>
        <div className={`hx-container hx-api-row ${apiVis ? "is-visible" : ""}`}>
          <div className="hx-api-text">
            <p className="hx-eyebrow" style={{ textAlign: "left" }}>Built for developers</p>
            <h2 className="hx-section-title" style={{ textAlign: "left" }}>Simple REST API</h2>
            <p className="hx-api-desc">
              Integrate SMS into any application with a single POST request. No SDKs, no complexity — just an API key and a JSON body.
            </p>
            <div className="hx-api-points">
              <div className="hx-api-point">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>API key authentication</span>
              </div>
              <div className="hx-api-point">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>JSON request / response</span>
              </div>
              <div className="hx-api-point">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Real-time delivery tracking</span>
              </div>
              <div className="hx-api-point">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Bulk send via CSV upload</span>
              </div>
            </div>
          </div>
          <div className="hx-api-code">
            <div className="hx-code-header">
              <div className="hx-code-dots">
                <span /><span /><span />
              </div>
              <span className="hx-code-label">POST /api/v1/send</span>
            </div>
            <pre className="hx-code-body"><code>{CODE_SNIPPET}</code></pre>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="hx-cta" ref={ctaRef}>
        <div className={`hx-cta-inner ${ctaVis ? "is-visible" : ""}`}>
          <h2 className="hx-cta-title">Ready to Get Started?</h2>
          <p className="hx-cta-desc">Create a free account and start sending SMS in under 2 minutes.</p>
          <button onClick={() => navigate("/register")} className="hx-btn-cta-white">
            Create Free Account
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
