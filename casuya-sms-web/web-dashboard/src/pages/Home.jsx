import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";

const FEATURES = [
  { icon: "\u{1F4F1}", title: "Your Own Phone", desc: "Use your Android device as an SMS gateway. No third-party services, no per-message fees." },
  { icon: "\u{1F4E8}", title: "Bulk SMS", desc: "Upload a CSV file and send personalized messages to hundreds of recipients at once." },
  { icon: "\u{1F4DD}", title: "Templates", desc: "Create reusable message templates with variables. Perfect for report cards, alerts, and notifications." },
  { icon: "\u{1F50C}", title: "REST API", desc: "Integrate SMS sending into your own apps with a simple API. Just an API key and a POST request." },
  { icon: "\u{1F4CA}", title: "Delivery Tracking", desc: "Track every message sent with real-time status updates and a complete SMS log." },
  { icon: "\u{1F512}", title: "Secure & Private", desc: "Your data stays on your server. Self-hostable, open-source, and fully under your control." },
];

const STEPS = [
  { num: "1", title: "Install the App", desc: "Download the Android app and grant SMS permissions." },
  { num: "2", title: "Connect Your Device", desc: "Scan the QR code or enter your API key to link your phone." },
  { num: "3", title: "Start Sending", desc: "Send SMS from the dashboard, the API, or upload a CSV for bulk delivery." },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-root">
      {/* Nav */}
      <nav className="home-nav">
        <div className="home-nav-brand">casuya-sms</div>
        <div className="home-nav-links">
          <button onClick={() => navigate("/login")} className="home-btn-outline">
            Login
          </button>
          <button onClick={() => navigate("/login")} className="home-btn-primary">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero-inner">
          <span className="home-badge">Open Source &middot; Android SMS Gateway</span>
          <h1 className="home-hero-title">
            Turn Your Phone Into an
            <br />
            <span style={{ color: "#1e88e5" }}>SMS Gateway</span>
          </h1>
          <p className="home-hero-desc">
            Send and receive SMS messages using your own Android device. Perfect for schools, businesses, and developers.
          </p>
          <div className="home-hero-actions">
            <button onClick={() => navigate("/login")} className="home-btn-cta">
              Start Sending Free
            </button>
            <a href="https://github.com/casuya-code/casuya-sms" target="_blank" rel="noreferrer" className="home-btn-ghost">
              View on GitHub
            </a>
          </div>
          <div className="home-hero-points">
            <span>&#10003; No per-message fees</span>
            <span>&#10003; Self-hosted data</span>
            <span>&#10003; Setup in minutes</span>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="home-section home-section-white">
        <div className="home-container">
          <p className="home-eyebrow">Get started in three steps</p>
          <h2 className="home-section-title">How It Works</h2>
          <div className="home-steps-grid">
            {STEPS.map((s) => (
              <div key={s.num} className="home-step">
                <div className="home-step-num">{s.num}</div>
                <div className="home-step-title">{s.title}</div>
                <div className="home-step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="home-section home-section-gray">
        <div className="home-container">
          <p className="home-eyebrow">Everything included</p>
          <h2 className="home-section-title">Everything You Need</h2>
          <div className="home-features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="home-feature-card">
                <div className="home-feature-icon">{f.icon}</div>
                <div className="home-feature-title">{f.title}</div>
                <div className="home-feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="home-cta">
        <div className="home-cta-inner">
          <h2 className="home-cta-title">Ready to Get Started?</h2>
          <p className="home-cta-desc">Create a free account and start sending SMS in under 2 minutes.</p>
          <button onClick={() => navigate("/login")} className="home-btn-cta-white">
            Create Free Account
          </button>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}