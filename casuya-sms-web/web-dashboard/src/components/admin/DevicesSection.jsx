import { useState } from "react";

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

export default function DevicesSection({ devices }) {
  const [search, setSearch] = useState("");

  const filtered = devices.filter(
    (d) =>
      d.device_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      d.status?.toLowerCase().includes(search.toLowerCase())
  );

  const online = devices.filter((d) => d.status === "online").length;
  const offline = devices.length - online;

  return (
    <div>
      <div className="flex-header" style={{ marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18 }}>Device Management</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>
            {devices.length} total ·{" "}
            <span style={{ color: "#4caf50" }}>{online} online</span> ·{" "}
            <span style={{ color: "#888" }}>{offline} offline</span>
          </p>
        </div>
        <input
          type="text"
          placeholder="Search by name, owner, or status..."
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
                <th style={th}>Device ID</th>
                <th style={th}>Name</th>
                <th style={th}>Status</th>
                <th style={th}>Owner</th>
                <th style={th}>Registered</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr
                  key={d.id}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ ...td, fontFamily: "monospace", fontSize: 12, color: "#888" }}>
                    {d.id.slice(0, 12)}...
                  </td>
                  <td style={{ ...td, fontWeight: 500 }}>{d.device_name}</td>
                  <td style={td}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "3px 10px",
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600,
                        background: d.status === "online" ? "#d4edda" : "#e2e3e5",
                        color: d.status === "online" ? "#155724" : "#6c757d",
                      }}
                    >
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: d.status === "online" ? "#4caf50" : "#aaa",
                        }}
                      />
                      {d.status}
                    </span>
                  </td>
                  <td style={td}>{d.user_email}</td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>
                    {new Date(d.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p style={{ color: "#888", textAlign: "center", padding: 24, margin: 0 }}>
            {search ? "No devices match your search." : "No devices registered."}
          </p>
        )}
      </div>
    </div>
  );
}
