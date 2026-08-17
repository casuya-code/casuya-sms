import { Link } from "react-router-dom";

const APK_URL = "https://github.com/casuya-code/casuya-sms/releases/latest/download/app-release.apk";

const DOWNLOAD = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const GITHUB = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const DOCS = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const SEND = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

const KEY = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

const BUG = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const SHIELD = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const DOC = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo-block">
              <span className="footer-logo-mark">CS</span>
              <span className="footer-logo">casuya-sms</span>
            </div>
            <p className="footer-tagline">
              Open-source SMS gateway. Turn any Android phone into an SMS API.
            </p>
            <a
              href={APK_URL}
              download
              target="_blank"
              rel="noopener"
              className="footer-cta"
            >
              {DOWNLOAD}
              Download Android App
            </a>
            <div className="footer-badges">
              <span className="footer-badge">Self-hosted</span>
              <span className="footer-badge">REST API</span>
              <span className="footer-badge">MIT Licensed</span>
            </div>
          </div>

          <div className="footer-links">
            <div className="footer-col">
              <h4 className="footer-heading">Product</h4>
              <a href={APK_URL} download className="footer-link" target="_blank" rel="noopener">
                {DOWNLOAD}Download App
              </a>
              <Link to="/dashboard?section=send" className="footer-link">
                {SEND}Send SMS
              </Link>
              <Link to="/dashboard?section=apikeys" className="footer-link">
                {KEY}Developer Keys
              </Link>
            </div>

            <div className="footer-col">
              <h4 className="footer-heading">Developers</h4>
              <a href="https://github.com/casuya-code/casuya-sms" className="footer-link" target="_blank" rel="noopener">
                {GITHUB}GitHub
              </a>
              <a href="https://github.com/casuya-code/casuya-sms#api-reference" className="footer-link" target="_blank" rel="noopener">
                {DOCS}API Documentation
              </a>
              <a href="https://github.com/casuya-code/casuya-sms/issues" className="footer-link" target="_blank" rel="noopener">
                {BUG}Report Issue
              </a>
            </div>

            <div className="footer-col">
              <h4 className="footer-heading">Legal</h4>
              <Link to="/privacy" className="footer-link">
                {SHIELD}Privacy Policy
              </Link>
              <Link to="/terms" className="footer-link">
                {DOC}Terms of Service
              </Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span className="footer-copy">&copy; {new Date().getFullYear()} Casuya Systems. All rights reserved.</span>
          <span className="footer-made">Built open-source &mdash; your data, your server</span>
          <div className="footer-bottom-links">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <a href="https://github.com/casuya-code/casuya-sms" target="_blank" rel="noopener">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  );
}