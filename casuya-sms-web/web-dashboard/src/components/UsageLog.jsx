import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

const STATUS_STYLE = {
  queued: { bg: "#fff3cd", color: "#856404", label: "Queued" },
  delivered: { bg: "#d4edda", color: "#155724", label: "Delivered" },
  failed: { bg: "#f8d7da", color: "#721c24", label: "Failed" },
};

function Badge({ status }) {
  const s = STATUS_STYLE[status] || { bg: "#e2e3e5", color: "#383d41", label: status };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
        background: s.bg,
        color: s.color,
      }}
    >
      {s.label}
    </span>
  );
}

export default function UsageLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/api/v1/sms/logs");
      setLogs(res.data);
      setError("");
    } catch (e) {
      setError(e.response?.data?.error || "failed to load logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    load().then(() => {}).catch(() => {});
    return () => { cancelled = true; };
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [autoRefresh, load]);

  const card = {
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: 16,
  };

  const th = {
    textAlign: "left",
    padding: "10px 12px",
    borderBottom: "2px solid #e0e0e0",
    fontSize: 13,
    fontWeight: 600,
    color: "#555",
    whiteSpace: "nowrap",
  };

  const td = {
    padding: "10px 12px",
    borderBottom: "1px solid #f0f0f0",
    fontSize: 13,
  };

  const hasQueued = logs.some((l) => l.status === "queued");

  return (
    <section style={card}>
      <div
        className="flex-header"
        style={{ marginBottom: logs.length > 0 ? 12 : 0 }}
      >
        <h2 style={{ margin: 0 }}>SMS Logs</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {hasQueued && (
            <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh
            </label>
          )}
          <button
            onClick={load}
            disabled={loading}
            style={{
              cursor: "pointer",
              padding: "6px 14px",
              fontSize: 13,
              background: "#f5f5f5",
              border: "1px solid #ddd",
              borderRadius: 4,
            }}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <p
          style={{
            color: "#d32f2f",
            padding: "8px 12px",
            background: "#ffebee",
            borderRadius: 6,
            border: "1px solid #ef9a9a",
            margin: "0 0 12px",
            fontSize: 14,
          }}
        >
          {error}
        </p>
      )}

      {loading && logs.length === 0 && (
        <p style={{ color: "#888", textAlign: "center", padding: 20 }}>Loading logs...</p>
      )}

      {!loading && logs.length === 0 && (
        <p style={{ color: "#888", textAlign: "center", padding: 20 }}>
          No SMS logs yet. Send your first SMS above.
        </p>
      )}

      {logs.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>#</th>
                <th style={th}>To</th>
                <th style={th}>Message</th>
                <th style={th}>Status</th>
                <th style={th}>Device</th>
                <th style={th}>Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ transition: "background 0.15s" }}>
                  <td style={td}>{log.id}</td>
                  <td style={{ ...td, fontWeight: 500, whiteSpace: "nowrap" }}>{log.to_number}</td>
                  <td
                    style={{
                      ...td,
                      maxWidth: 280,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: "#555",
                    }}
                    title={log.message}
                  >
                    {log.message}
                  </td>
                  <td style={td}>
                    <Badge status={log.status} />
                  </td>
                  <td
                    style={{
                      ...td,
                      fontFamily: "monospace",
                      fontSize: 12,
                      color: "#888",
                    }}
                    title={log.device_id}
                  >
                    {log.device_id ? log.device_id.slice(0, 8) + "..." : "—"}
                  </td>
                  <td style={{ ...td, whiteSpace: "nowrap", color: "#888" }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
