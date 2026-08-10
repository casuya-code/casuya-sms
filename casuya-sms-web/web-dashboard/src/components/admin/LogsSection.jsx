import { useState } from "react";

const STATUS_STYLE = {
  queued: { bg: "#fff3cd", color: "#856404" },
  delivered: { bg: "#d4edda", color: "#155724" },
  failed: { bg: "#f8d7da", color: "#721c24" },
};

const td = {
  padding: "12px 14px",
  borderBottom: "1px solid #f0f0f0",
  fontSize: 13,
};

const th = {
  textAlign: "left",
  padding: "12px 14px",
  borderBottom: "2px solid #e0e0e0",
  fontSize: 12,
  fontWeight: 600,
  color: "#666",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  whiteSpace: "nowrap",
};

export default function LogsSection({ logs }) {
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
          <h2 style={{ margin: 0, fontSize: 18 }}>SMS Logs</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>
            {logs.length} total messages
          </p>
        </div>
        <div className="filter-bar">
          <div style={{ display: "flex", gap: 4 }}>
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
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>#</th>
                <th style={th}>To</th>
                <th style={th}>Message</th>
                <th style={th}>Status</th>
                <th style={th}>User</th>
                <th style={th}>Device</th>
                <th style={th}>Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => {
                const s = STATUS_STYLE[log.status] || STATUS_STYLE.queued;
                return (
                  <tr
                    key={log.id}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={td}>{log.id}</td>
                    <td style={{ ...td, whiteSpace: "nowrap", fontWeight: 500 }}>
                      {log.to_number}
                    </td>
                    <td
                      style={{
                        ...td,
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
                    <td style={td}>
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
                    <td style={td}>{log.user_email}</td>
                    <td style={{ ...td, fontFamily: "monospace", fontSize: 12, color: "#888" }}>
                      {log.device_id ? log.device_id.slice(0, 8) + "..." : "—"}
                    </td>
                    <td style={{ ...td, whiteSpace: "nowrap", color: "#888" }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p style={{ color: "#888", textAlign: "center", padding: 24, margin: 0 }}>
            {search || statusFilter !== "all"
              ? "No logs match your filters."
              : "No SMS logs yet."}
          </p>
        )}
      </div>
    </div>
  );
}
