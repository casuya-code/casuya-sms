import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { getActiveApiKey } from "./ApiKeyManager";
import BulkSend from "./BulkSend";

export default function SendSmsPanel() {
  const [devices, setDevices] = useState([]);
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [bulkView, setBulkView] = useState(false);

  const loadDevices = useCallback(async () => {
    try {
      const res = await api.get("/api/devices");
      setDevices(res.data);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadDevices().then(() => {}).catch(() => {});
    return () => { cancelled = true; };
  }, [loadDevices]);

  const onlineDevices = devices.filter((d) => d.status === "online");
  const apiKey = getActiveApiKey();

  const send = async () => {
    if (!apiKey) {
      setError("No API key found. Generate one in the Developer Keys section first.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await api.post(
        "/api/v1/send",
        { to: to.trim(), message },
        { headers: { "X-API-KEY": apiKey } }
      );
      setResult(res.data);
      setTo("");
      setMessage("");
    } catch (e) {
      setError(e.response?.data?.error || "failed to send SMS");
    } finally {
      setLoading(false);
    }
  };

  const canSend = apiKey && to.trim() && message.trim() && onlineDevices.length > 0 && !loading;

  if (bulkView) {
    return (
      <BulkSend
        standalone={true}
        onDone={() => setBulkView(false)}
        onBack={() => setBulkView(false)}
      />
    );
  }

  const card = {
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: 16,
  };

  const inputStyle = {
    padding: "10px 12px",
    fontSize: 14,
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #ddd",
    borderRadius: 4,
  };

  const charCount = message.length;
  const nearLimit = charCount > 1400;
  const overLimit = charCount > 1500;

  return (
    <section style={card}>
      <div className="flex-header" style={{ marginBottom: 12 }}>
        <h2 style={{ marginTop: 0 }}>Send SMS</h2>
        <button
          onClick={() => setBulkView(true)}
          style={{
            cursor: "pointer",
            padding: "8px 18px",
            background: "#2e7d32",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Quick Bulk Send
        </button>
      </div>

      {!apiKey && (
        <div style={{ padding: 12, background: "#fff3cd", border: "1px solid #ffc107", borderRadius: 6, marginBottom: 12, fontSize: 14 }}>
          You need an API key to send SMS. Generate one in the <strong>Developer Keys</strong> section above.
        </div>
      )}

      {apiKey && devices.length === 0 && (
        <div style={{ padding: 12, background: "#e3f2fd", border: "1px solid #90caf9", borderRadius: 6, marginBottom: 12, fontSize: 14 }}>
          No devices registered yet. Use the <strong>Devices</strong> section above to register one, then connect your Android device.
        </div>
      )}

      {apiKey && devices.length > 0 && onlineDevices.length === 0 && (
        <div style={{ padding: 12, background: "#fff3e0", border: "1px solid #ffcc80", borderRadius: 6, marginBottom: 12, fontSize: 14 }}>
          No devices online. Your Android device must be connected and running to send SMS.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
        <input
          type="tel"
          placeholder="Phone number (e.g. +639123456789)"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          style={inputStyle}
          disabled={!apiKey}
        />
        <div style={{ position: "relative" }}>
          <textarea
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            style={{ ...inputStyle, resize: "vertical", paddingRight: 70 }}
            disabled={!apiKey}
          />
          <span style={{
            position: "absolute", bottom: 10, right: 12, fontSize: 12,
            color: overLimit ? "#d32f2f" : nearLimit ? "#e65100" : "#999",
            fontWeight: nearLimit ? 600 : 400,
          }}>
            {charCount}/1500
          </span>
        </div>
      </div>

      <button onClick={send} disabled={!canSend} style={{
        cursor: canSend ? "pointer" : "not-allowed", padding: "10px 24px",
        fontSize: 14, fontWeight: 600, background: canSend ? "#1e88e5" : "#bbb",
        color: "#fff", border: "none", borderRadius: 4,
      }}>
        {loading ? "Sending..." : "Send SMS"}
      </button>

      {result && (
        <div style={{ marginTop: 14, padding: 12, borderRadius: 6, background: "#e8f5e9", border: "1px solid #a5d6a7" }}>
          <div style={{ fontWeight: 600, color: "#2e7d32", marginBottom: 4 }}>SMS Queued Successfully</div>
          <div style={{ fontSize: 13, color: "#555" }}>
            Log ID: <strong>{result.sms_log_id}</strong> · Device: <code>{result.device_id?.slice(0, 8)}...</code> · Status: <strong>{result.status}</strong>
          </div>
        </div>
      )}

      {error && (
        <p style={{ color: "#d32f2f", marginTop: 12, padding: "8px 12px", background: "#ffebee", borderRadius: 6, border: "1px solid #ef9a9a", margin: "12px 0 0" }}>
          {error}
        </p>
      )}
    </section>
  );
}
