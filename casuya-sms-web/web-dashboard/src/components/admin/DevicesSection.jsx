import { useState } from "react";
import Pagination from "../Pagination";

export default function DevicesSection({ devices, total, page, pageSize, onPage }) {
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
          <h2 className="section-title">Device Management</h2>
          <p className="section-sub">
            {total} total ·{" "}
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
          <table className="tbl">
            <thead>
              <tr>
                <th>Device ID</th>
                <th>Name</th>
                <th>Status</th>
                <th>Owner</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td style={{ fontFamily: "monospace", fontSize: 12, color: "#888" }}>
                    {d.id.slice(0, 12)}...
                  </td>
                  <td style={{ fontWeight: 500 }}>{d.device_name}</td>
                  <td>
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
                  <td>{d.user_email}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {new Date(d.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="table-empty">
            {search ? "No devices match your search." : "No devices registered."}
          </p>
        )}
        <Pagination page={page} pageSize={pageSize} total={total} onPage={onPage} />
      </div>
    </div>
  );
}
