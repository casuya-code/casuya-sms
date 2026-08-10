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

export default function UsersSection({ users, currentUser, onBan, onDelete, onRoleChange }) {
  const [search, setSearch] = useState("");

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex-header" style={{ marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18 }}>User Management</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>
            {users.length} registered users
          </p>
        </div>
        <input
          type="text"
          placeholder="Search by email or role..."
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
                <th style={th}>ID</th>
                <th style={th}>Email</th>
                <th style={th}>Role</th>
                <th style={th}>Status</th>
                <th style={th}>Joined</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  style={{ transition: "background 0.1s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={td}>{u.id}</td>
                  <td style={{ ...td, fontWeight: 500 }}>{u.email}</td>
                  <td style={td}>
                    <select
                      value={u.role}
                      onChange={(e) => onRoleChange(u.id, e.target.value)}
                      disabled={u.id === currentUser?.id}
                      style={{
                        padding: "4px 8px",
                        fontSize: 13,
                        borderRadius: 4,
                        border: "1px solid #ddd",
                        cursor: u.id === currentUser?.id ? "not-allowed" : "pointer",
                      }}
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td style={td}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "3px 10px",
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600,
                        background: u.banned ? "#f8d7da" : "#d4edda",
                        color: u.banned ? "#721c24" : "#155724",
                      }}
                    >
                      {u.banned ? "Banned" : "Active"}
                    </span>
                  </td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {u.id !== currentUser?.id && (
                        <>
                          <button
                            onClick={() => onBan(u.id, u.banned)}
                            style={{
                              cursor: "pointer",
                              padding: "5px 12px",
                              fontSize: 12,
                              background: u.banned ? "#d4edda" : "#fff3e0",
                              color: u.banned ? "#155724" : "#e65100",
                              border: `1px solid ${u.banned ? "#a5d6a7" : "#ffcc80"}`,
                              borderRadius: 4,
                              fontWeight: 500,
                            }}
                          >
                            {u.banned ? "Unban" : "Ban"}
                          </button>
                          <button
                            onClick={() => onDelete(u.id, u.email)}
                            style={{
                              cursor: "pointer",
                              padding: "5px 12px",
                              fontSize: 12,
                              color: "#d32f2f",
                              background: "none",
                              border: "1px solid #ef9a9a",
                              borderRadius: 4,
                              fontWeight: 500,
                            }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p style={{ color: "#888", textAlign: "center", padding: 24, margin: 0 }}>
            {search ? "No users match your search." : "No users found."}
          </p>
        )}
      </div>
    </div>
  );
}
