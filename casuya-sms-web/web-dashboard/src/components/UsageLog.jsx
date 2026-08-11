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
  const [deletingId, setDeletingId] = useState(null);
  const [clearingAll, setClearingAll] = useState(false);

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

  const deleteOne = async (id) => {
    if (!confirm("Delete this log entry?")) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/v1/sms/logs/${id}`);
      setLogs((prev) => prev.filter((l) => l.id !== id));
    } catch (e) {
      setError(e.response?.data?.error || "failed to delete log");
    } finally {
      setDeletingId(null);
    }
  };

  const clearAll = async () => {
    if (!confirm("Delete ALL log entries? This cannot be undone.")) return;
    setClearingAll(true);
    try {
      const res = await api.delete("/api/v1/sms/logs");
      setLogs([]);
      alert(`Deleted ${res.data.deleted} log(s).`);
    } catch (e) {
      setError(e.response?.data?.error || "failed to clear logs");
    } finally {
      setClearingAll(false);
    }
  };

  return (
    <section className="logs-card">
      <div className="logs-header">
        <h2 className="logs-title">SMS Logs</h2>
        <div className="logs-controls">
          {logs.length > 0 && (
            <button
              onClick={clearAll}
              disabled={clearingAll}
              className="logs-clear-btn"
            >
              {clearingAll ? "Clearing..." : "Clear All"}
            </button>
          )}
          <label className="logs-auto-label">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
          <button
            onClick={load}
            disabled={loading}
            className="logs-refresh-btn"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <p className="logs-error">{error}</p>
      )}

      {loading && logs.length === 0 && (
        <p className="logs-empty">Loading logs...</p>
      )}

      {!loading && logs.length === 0 && (
        <p className="logs-empty">No SMS logs yet. Send your first SMS above.</p>
      )}

      {logs.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="logs-table-wrap">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>To</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Device</th>
                  <th>Time</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="logs-td-id">{log.id}</td>
                    <td className="logs-td-to">{log.to_number}</td>
                    <td className="logs-td-msg" title={log.message}>{log.message}</td>
                    <td><Badge status={log.status} /></td>
                    <td className="logs-td-device" title={log.device_id}>
                      {log.device_id ? log.device_id.slice(0, 8) + "..." : "\u2014"}
                    </td>
                    <td className="logs-td-time">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="logs-td-actions">
                      <button
                        onClick={() => deleteOne(log.id)}
                        disabled={deletingId === log.id}
                        className="logs-delete-btn"
                        title="Delete this log"
                      >
                        {deletingId === log.id ? "..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="logs-mobile-cards">
            {logs.map((log) => (
              <div key={log.id} className="logs-mobile-card">
                <div className="logs-mobile-top">
                  <span className="logs-mobile-id">#{log.id}</span>
                  <Badge status={log.status} />
                </div>
                <div className="logs-mobile-to">{log.to_number}</div>
                <div className="logs-mobile-msg" title={log.message}>{log.message}</div>
                <div className="logs-mobile-bottom">
                  <span className="logs-mobile-device" title={log.device_id}>
                    {log.device_id ? log.device_id.slice(0, 8) + "..." : "\u2014"}
                  </span>
                  <span className="logs-mobile-time">{new Date(log.created_at).toLocaleString()}</span>
                </div>
                <button
                  onClick={() => deleteOne(log.id)}
                  disabled={deletingId === log.id}
                  className="logs-delete-btn logs-delete-mobile"
                  title="Delete this log"
                >
                  {deletingId === log.id ? "..." : "Delete"}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
