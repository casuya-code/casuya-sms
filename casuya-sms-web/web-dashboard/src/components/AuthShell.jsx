const CHECK = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function AuthShell({ children }) {
  return (
    <div className="auth-root">
      <aside className="auth-brand">
        <div className="auth-brand-inner">
          <div className="auth-brand-logo">
            <span className="auth-brand-mark">CS</span>
            <span className="auth-brand-name">casuya-sms</span>
          </div>
          <h1 className="auth-brand-title">Your phone, turned into an SMS gateway.</h1>
          <p className="auth-brand-sub">
            Send, receive and track SMS from one clean dashboard — all through your own Android device.
          </p>
          <ul className="auth-brand-points">
            <li><span className="auth-point-icon">{CHECK}</span>No third-party providers, no per-message fees</li>
            <li><span className="auth-point-icon">{CHECK}</span>Bulk sending with templates &amp; variables</li>
            <li><span className="auth-point-icon">{CHECK}</span>Open-source and fully self-hosted</li>
          </ul>
          <p className="auth-brand-foot">&copy; {new Date().getFullYear()} Casuya Systems</p>
        </div>
      </aside>

      <main className="auth-main">{children}</main>
    </div>
  );
}