import { Link } from "react-router-dom";

export default function TermsOfService() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <Link to="/" className="legal-back">&larr; Back to Home</Link>
        <h1 className="legal-title">Terms of Service</h1>
        <p className="legal-updated">Last updated: August 11, 2026</p>

        <div className="legal-content">
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing or using Casuya SMS ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>

          <h2>2. Description of Service</h2>
          <p>Casuya SMS is an open-source SMS gateway platform that allows users to send SMS messages via a REST API using an Android device as the sending endpoint.</p>

          <h2>3. User Responsibilities</h2>
          <ul>
            <li>You must be at least 13 years old to use the Service</li>
            <li>You are responsible for maintaining the security of your account and API keys</li>
            <li>You must not use the Service for spam, harassment, or illegal activities</li>
            <li>You must comply with all applicable telecommunications regulations in your jurisdiction</li>
            <li>You are responsible for any SMS charges incurred through your device</li>
          </ul>

          <h2>4. Prohibited Uses</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Send spam or unsolicited messages</li>
            <li>Send messages containing illegal, harmful, or offensive content</li>
            <li>Use the Service for phishing or fraud</li>
            <li>Attempt to gain unauthorized access to the Service</li>
            <li>Interfere with or disrupt the Service</li>
            <li>Use the Service to violate any laws or regulations</li>
            <li>Resell or redistribute the Service without authorization</li>
          </ul>

          <h2>5. Account Termination</h2>
          <p>We reserve the right to suspend or terminate your account at any time for violations of these Terms. You may also delete your account at any time from the dashboard.</p>

          <h2>6. Intellectual Property</h2>
          <p>Casuya SMS is open-source software licensed under the MIT License. You are free to use, modify, and distribute the software in accordance with the license terms.</p>

          <h2>7. Disclaimer of Warranties</h2>
          <p>The Service is provided "as is" without warranties of any kind. We do not guarantee uninterrupted or error-free service. SMS delivery depends on your mobile carrier and device connectivity.</p>

          <h2>8. Limitation of Liability</h2>
          <p>Casuya Systems shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service, including but not limited to loss of data, SMS delivery failures, or service interruptions.</p>

          <h2>9. SMS Delivery</h2>
          <p>We do not guarantee SMS delivery. Delivery depends on:</p>
          <ul>
            <li>Your Android device being online and connected</li>
            <li>Your mobile carrier's network availability</li>
            <li>The recipient's phone being reachable</li>
            <li>Local telecommunications regulations</li>
          </ul>

          <h2>10. Changes to Terms</h2>
          <p>We reserve the right to modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.</p>

          <h2>11. Governing Law</h2>
          <p>These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.</p>

          <h2>12. Contact</h2>
          <p>Questions about these Terms? Contact us at <a href="mailto:legal@casuya.dev">legal@casuya.dev</a>.</p>
        </div>
      </div>
    </div>
  );
}
