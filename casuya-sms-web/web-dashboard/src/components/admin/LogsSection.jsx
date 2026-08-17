import { useState } from "react";
import Pagination from "../Pagination";
import { formatDateTime } from "../../lib/format";

const STATUS_STYLE = {
  queued: { bg: "#fff3cd", color: "#856404" },
  delivered: { bg: "#d4edda", color: "#155724" },
  failed: { bg: "#f8d7da", color: "#721c24" },
};

export default function LogsSection({ logs, total, page, pageSize, onPage }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = logs.filter((log) => {
    const matchesSearch =
      log.to_number?.toLowerCase().includes(search.toLowerCase()) ||
      log.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      log.message?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    all: logs.length,
    queued: logs.filter((l) => l.status === "queued").length,
    delivered: logs.filter((l) => l.status === "delivered").length,
    failed: logs.filter((l) => l.status === "failed").length,
  };

  return (
    <div>
      <div
        className="flex-header"
        style={{ marginBottom: 16, flexWrap: "wrap", gap: 12 }}
      >
        <div>
          <h2 className="section-title">SMS Logs</h2>
          <p className="section-sub">
            {total} total messages
          </p>
        </div>
        <div className="filter-bar">
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {["all", "queued", "delivered", "failed"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: "5px 12px",
                  fontSize: 12,
                  fontWeight: 500,
                  border: "1px solid #ddd",
                  borderRadius: 4,
                  cursor: "pointer",
                  background: statusFilter === s ? "#1e88e5" : "#fff",
                  color: statusFilter === s ? "#fff" : "#666",
                  borderColor: statusFilter === s ? "#1e88e5" : "#ddd",
                }}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s]})
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search by number, user, or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
            style={{
              padding: "8px 14px",
              fontSize: 13,
              border: "1px solid #ddd",
              borderRadius: 6,
            }}
          />
        </div>
      </div>

      <div
        style={{
          border: "1px solid #e0e0e0",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>#</th>
                <th>To</th>
                <th>Message</th>
                <th>Status</th>
                <th>User</th>
                <th>Device</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => {
                const s = STATUS_STYLE[log.status] || STATUS_STYLE.queued;
                return (
                  <tr key={log.id}>
                    <td>{log.id}</td>
                    <td style={{ whiteSpace: "nowrap", fontWeight: 500 }}>
                      {log.to_number}
                    </td>
                    <td
                      style={{
                        maxWidth: 240,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: "#555",
                      }}
                      title={log.message}
                    >
                      {log.message}
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 10px",
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 600,
                          background: s.bg,
                          color: s.color,
                        }}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td>{log.user_email}</td>
                    <td style={{ fontFamily: "monospace", fontSize: 12, color: "#888" }}>
                      {log.device_id ? log.device_id.slice(0, 8) + "..." : "—"}
                    </td>
                    <td style={{ whiteSpace: "nowrap", color: "#888" }}>
                      {formatDateTime(log.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="table-empty">
            {search || statusFilter !== "all"
              ? "No logs match your filters."
              : "No SMS logs yet."}
          </p>
        )}
        <Pagination page={page} pageSize={pageSize} total={total} onPage={onPage} />
      </div>
    </div>
  );
}
