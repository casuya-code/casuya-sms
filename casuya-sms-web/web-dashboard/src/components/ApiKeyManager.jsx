import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { formatDate } from "../lib/format";

const ACTIVE_KEY = "casuya_api_key";
const ACTIVE_KEY_ID = "casuya_api_key_id";

export function getActiveApiKey() {
  return localStorage.getItem(ACTIVE_KEY) || "";
}

export function getActiveApiKeyId() {
  return localStorage.getItem(ACTIVE_KEY_ID) || "";
}

export function setActiveApiKey(raw, id) {
  localStorage.setItem(ACTIVE_KEY, raw);
  if (id) localStorage.setItem(ACTIVE_KEY_ID, String(id));
}

export function clearActiveApiKey() {
  localStorage.removeItem(ACTIVE_KEY);
  localStorage.removeItem(ACTIVE_KEY_ID);
}

export default function ApiKeyManager() {
  const [keys, setKeys] = useState([]);
  const [raw, setRaw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/api/apikeys");
      setKeys(res.data);
    } catch (e) {
      setError(e.response?.data?.error || "failed to load keys");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    load().then(() => {}).catch(() => {});
    return () => { cancelled = true; };
  }, [load]);

  const generate = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    setRaw("");
    try {
      const res = await api.post("/api/apikeys");
      setRaw(res.data.raw);
      setActiveApiKey(res.data.raw, res.data.record?.id);
      load();
    } catch (e) {
      setError(e.response?.data?.error || "failed to generate key");
    } finally {
      setLoading(false);
    }
  };

  const revoke = async (id) => {
    if (loading) return;
    if (!confirm("Revoke this key? Any scripts using it will stop working.")) return;
    try {
      await api.post(`/api/apikeys/${id}/revoke`);
      if (getActiveApiKeyId() === String(id)) clearActiveApiKey();
      load();
    } catch (e) {
      setError(e.response?.data?.error || "failed to revoke key");
    }
  };

  const remove = async (id) => {
    if (loading) return;
    if (!confirm("Permanently delete this key? This cannot be undone.")) return;
    try {
      await api.delete(`/api/apikeys/${id}`);
      if (getActiveApiKeyId() === String(id)) clearActiveApiKey();
      load();
    } catch (e) {
      setError(e.response?.data?.error || "failed to delete key");
    }
  };

  const copyKey = () => {
    navigator.clipboard.writeText(raw).then(() => {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }).catch(() => {});
  };

  const card = {
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: 16,
  };

  return (
    <section style={card}>
      <h2 style={{ marginTop: 0 }}>Developer Keys</h2>
      <p style={{ margin: "0 0 12px", fontSize: 14, color: "#555" }}>
Generate a key, then use it with <code>POST /api/v1/send</code> and header{" "}
          <code>X-API-KEY</code> to send SMS programmatically.
      </p>
      <button
        onClick={generate}
        disabled={loading}
        style={{
          cursor: "pointer",
          padding: "8px 16px",
          background: "#1e88e5",
          color: "#fff",
          border: "none",
          borderRadius: 4,
          fontSize: 14,
        }}
      >
        {loading ? "Generating..." : "Generate New Key"}
      </button>
      {raw && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 6,
            background: "#fff3cd",
            border: "1px solid #ffc107",
          }}
        >
          <strong style={{ color: "#856404" }}>
            Copy this key now — it is shown only once:
          </strong>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 8,
            }}
          >
            <code
              style={{
                flex: 1,
                padding: 8,
                background: "#fff",
                borderRadius: 4,
                border: "1px solid #e0e0e0",
                fontSize: 13,
                wordBreak: "break-all",
              }}
            >
              {raw}
            </code>
            <button
              onClick={copyKey}
              style={{
                cursor: "pointer",
                padding: "6px 12px",
                background: copiedKey ? "#4caf50" : "#fff",
                color: copiedKey ? "#fff" : "#333",
                border: "1px solid #ccc",
                borderRadius: 4,
                fontSize: 13,
                whiteSpace: "nowrap",
              }}
            >
              {copiedKey ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}
      {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}
      <div style={{ marginTop: 16 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 15 }}>Your Keys</h3>
        {keys.length === 0 && <p style={{ color: "#888", margin: 0 }}>No API keys yet.</p>}
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {keys.map((k, idx) => (
            <li
              key={k.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 0",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: k.revoked ? "#f44336" : "#4caf50",
                }}
              />
              <span style={{ flex: 1, fontSize: 14 }}>
                Key #{keys.length - idx} — created {formatDate(k.created_at)}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: k.revoked ? "#d32f2f" : "#4caf50",
                  fontWeight: 600,
                }}
              >
                {k.revoked ? "REVOKED" : "ACTIVE"}
              </span>
              {k.revoked ? (
                <button
                  onClick={() => remove(k.id)}
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
              ) : (
                <button
                  onClick={() => revoke(k.id)}
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
                  Revoke
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
