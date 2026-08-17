import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { formatDate } from "../lib/format";

const EVENT_LABELS = {
  "sms.sent": "SMS sent (queued)",
  "sms.status": "SMS delivered / failed",
  "sms.received": "Inbound SMS received",
};

export default function WebhookManager() {
  const [webhooks, setWebhooks] = useState([]);
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/api/webhooks");
      setWebhooks(res.data);
    } catch (e) {
      setError(e.response?.data?.error || "failed to load webhooks");
    }
  }, []);

  useEffect(() => {
    load().then(() => {}).catch(() => {});
  }, [load]);

  const toggleEvent = (ev) => {
    setEvents((prev) =>
      prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev]
    );
  };

  const create = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      await api.post("/api/webhooks", { url: url.trim(), secret: secret.trim(), events });
      setUrl("");
      setSecret("");
      setEvents([]);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "failed to create webhook");
    } finally {
      setLoading(false);
    }
  };

  const update = async (id, body) => {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      await api.patch(`/api/webhooks/${id}`, body);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "failed to update webhook");
    } finally {
      setLoading(false);
    }
  };

  const toggleWebhookEvents = (wh) => {
    const all = Object.keys(EVENT_LABELS);
    const currentlyAll = all.length > 0 && wh.events.length === all.length;
    const next = currentlyAll ? [] : all;
    update(wh.id, { events: next });
  };

  const remove = async (id) => {
    if (loading) return;
    if (!confirm("Delete this webhook? Your endpoint will stop receiving events.")) return;
    setLoading(true);
    setError("");
    try {
      await api.delete(`/api/webhooks/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "failed to delete webhook");
    } finally {
      setLoading(false);
    }
  };

  const card = {
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: 16,
  };

  const inputStyle = {
    width: "100%",
    padding: 8,
    borderRadius: 4,
    border: "1px solid #ccc",
    fontSize: 14,
    boxSizing: "border-box",
  };

  const labelStyle = { display: "block", margin: "10px 0 4px", fontSize: 13, fontWeight: 600 };

  const btn = {
    cursor: "pointer",
    padding: "8px 16px",
    background: "#1e88e5",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    fontSize: 14,
  };

  return (
    <section style={card}>
      <h2 style={{ marginTop: 0 }}>Webhooks</h2>
      <p style={{ margin: "0 0 12px", fontSize: 14, color: "#555" }}>
        Casuya SMS will POST an event to your endpoint whenever an SMS is sent, its
        delivery status changes, or an inbound SMS is received. Add a secret to sign
        each payload so your server can verify it.
      </p>

      <form onSubmit={create} style={{ marginTop: 8 }}>
        <label style={labelStyle}>Endpoint URL</label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://your-app.example.com/sms/webhook"
          style={inputStyle}
          required
        />

        <label style={labelStyle}>Secret (for HMAC signature — optional)</label>
        <input
          type="text"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="a-long-random-secret"
          style={inputStyle}
        />

        <label style={labelStyle}>Events</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 6 }}>
          {Object.entries(EVENT_LABELS).map(([ev, label]) => (
            <label key={ev} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
              <input
                type="checkbox"
                checked={events.includes(ev)}
                onChange={() => toggleEvent(ev)}
              />
              {label}
            </label>
          ))}
        </div>

        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={loading} style={btn}>
            {loading ? "Saving..." : "Add Webhook"}
          </button>
        </div>
      </form>

      {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}

      <div style={{ marginTop: 20 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 15 }}>Your Webhooks</h3>
        {webhooks.length === 0 && (
          <p style={{ color: "#888", margin: 0 }}>No webhooks configured yet.</p>
        )}
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {webhooks.map((wh) => {
            const subscribed = wh.events.length === 0;
            const eventList = subscribed ? Object.keys(EVENT_LABELS) : wh.events;
            return (
              <li
                key={wh.id}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 0",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 14, wordBreak: "break-all" }}>{wh.url}</div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                    {wh.has_secret ? "Signed" : "No secret"} · created{" "}
                    {formatDate(wh.created_at)}
                  </div>
                  <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {eventList.map((ev) => (
                      <span
                        key={ev}
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 10,
                          background: "#e3f2fd",
                          color: "#1565c0",
                        }}
                      >
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => toggleWebhookEvents(wh)}
                    style={{
                      cursor: "pointer",
                      padding: "4px 10px",
                      fontSize: 12,
                      background: "none",
                      border: "1px solid #666",
                      borderRadius: 4,
                      color: "#333",
                    }}
                  >
                    {subscribed ? "Unsubscribe all" : "Subscribe all"}
                  </button>
                  <button
                    onClick={() => remove(wh.id)}
                    style={{
                      cursor: "pointer",
                      padding: "4px 10px",
                      fontSize: 12,
                      color: "#d32f2f",
                      background: "none",
                      border: "1px solid #d32f2f",
                      borderRadius: 4,
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}