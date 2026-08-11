import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <Link to="/" className="legal-back">&larr; Back to Home</Link>
        <h1 className="legal-title">Privacy Policy</h1>
        <p className="legal-updated">Last updated: August 11, 2026</p>

        <div className="legal-content">
          <h2>1. Introduction</h2>
          <p>Casuya Systems ("we", "us", "our") operates the Casuya SMS platform. This Privacy Policy explains how we collect, use, and protect your information when you use our web dashboard, API, and Android application.</p>

          <h2>2. Information We Collect</h2>
          <h3>Account Information</h3>
          <ul>
            <li>Email address (required for registration)</li>
            <li>Password (stored securely using bcrypt encryption)</li>
          </ul>

          <h3>Device Information</h3>
          <ul>
            <li>Device name and unique identifier</li>
            <li>Connection status (online/offline)</li>
            <li>Device model and Android version</li>
          </ul>

          <h3>SMS Data</h3>
          <ul>
            <li>Phone numbers you send messages to</li>
            <li>Message content</li>
            <li>Delivery status and timestamps</li>
          </ul>

          <h3>Usage Data</h3>
          <ul>
            <li>IP addresses (for rate limiting and security)</li>
            <li>API key usage patterns</li>
            <li>Browser type and version</li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <ul>
            <li>To provide and maintain the Casuya SMS service</li>
            <li>To authenticate your identity and secure your account</li>
            <li>To process and deliver SMS messages</li>
            <li>To monitor service usage and prevent abuse</li>
            <li>To communicate with you about service updates</li>
          </ul>

          <h2>4. Data Storage and Security</h2>
          <p>Your data is stored securely on encrypted databases hosted by Neon (PostgreSQL). We implement industry-standard security measures including:</p>
          <ul>
            <li>Bcrypt password hashing</li>
            <li>JWT authentication with short expiry</li>
            <li>HTTPS encryption for all communications</li>
            <li>Rate limiting to prevent abuse</li>
            <li>CORS protection</li>
          </ul>

          <h2>5. Data Sharing</h2>
          <p>We do <strong>not</strong> sell, trade, or share your personal information with third parties. Your data is only used to provide the Casuya SMS service.</p>

          <h2>6. SMS Message Content</h2>
          <p>SMS messages sent through our platform are processed in real-time and stored temporarily for delivery confirmation. We do not read, analyze, or share your message content with any third parties.</p>

          <h2>7. Data Retention</h2>
          <ul>
            <li>Account data: Retained until you delete your account</li>
            <li>SMS logs: Retained for 30 days, then automatically deleted</li>
            <li>API keys: Retained until you revoke them</li>
          </ul>

          <h2>8. Your Rights</h2>
          <ul>
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Delete your account and all associated data</li>
            <li>Export your data</li>
          </ul>

          <h2>9. Children's Privacy</h2>
          <p>Casuya SMS is not intended for use by children under 13. We do not knowingly collect information from children under 13.</p>

          <h2>10. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.</p>

          <h2>11. Contact Us</h2>
          <p>If you have questions about this Privacy Policy, please contact us at <a href="mailto:privacy@casuya.dev">privacy@casuya.dev</a>.</p>
        </div>
      </div>
    </div>
  );
}
