const STAT_CARDS = [
  { key: "users", label: "Total Users", color: "#1565c0", bg: "#e3f2fd", icon: "👥" },
  { key: "online_devices", label: "Online Devices", color: "#2e7d32", bg: "#e8f5e9", icon: "📱" },
  { key: "total_sms", label: "Total SMS Sent", color: "#e65100", bg: "#fff3e0", icon: "💬" },
];

export default function OverviewSection({ stats, users, devices, logs }) {
  if (!stats) return null;

  const recentUsers = users.slice(0, 5);
  const recentLogs = logs.slice(0, 5);

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}
      >
        {STAT_CARDS.map((c) => (
          <div
            key={c.key}
            style={{
              padding: 24,
              borderRadius: 10,
              background: c.bg,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div style={{ fontSize: 28 }}>{c.icon}</div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 700, color: c.color, lineHeight: 1 }}>
                {stats[c.key]}
              </div>
              <div style={{ fontSize: 14, color: "#555", marginTop: 4 }}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div
          style={{
            border: "1px solid #e0e0e0",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 18px",
              background: "#fafafa",
              borderBottom: "1px solid #e0e0e0",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Recent Users
          </div>
          <div style={{ padding: 0 }}>
            {recentUsers.length === 0 && (
              <p style={{ color: "#888", padding: 20, textAlign: "center", margin: 0 }}>
                No users yet
              </p>
            )}
            {recentUsers.map((u) => (
              <div
                key={u.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 18px",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: u.role === "admin" ? "#e3f2fd" : "#f5f5f5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 600,
                    color: u.role === "admin" ? "#1565c0" : "#666",
                  }}
                >
                    {(u.email && u.email[0] ? u.email[0] : "?").toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {u.email}
                  </div>
                  <div style={{ fontSize: 11, color: "#888" }}>
                    {u.role} · {new Date(u.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            border: "1px solid #e0e0e0",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 18px",
              background: "#fafafa",
              borderBottom: "1px solid #e0e0e0",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Recent SMS Activity
          </div>
          <div style={{ padding: 0 }}>
            {recentLogs.length === 0 && (
              <p style={{ color: "#888", padding: 20, textAlign: "center", margin: 0 }}>
                No SMS logs yet
              </p>
            )}
            {recentLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 18px",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background:
                      log.status === "delivered"
                        ? "#4caf50"
                        : log.status === "failed"
                        ? "#f44336"
                        : "#ff9800",
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{log.to_number}</div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#888",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {log.message}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "#aaa", whiteSpace: "nowrap" }}>
                  {new Date(log.created_at).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
