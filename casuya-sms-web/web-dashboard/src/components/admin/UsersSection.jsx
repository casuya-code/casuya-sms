import { useState } from "react";
import Pagination from "../Pagination";

export default function UsersSection({
  users,
  total,
  page,
  pageSize,
  onPage,
  currentUser,
  onBan,
  onDelete,
  onRoleChange,
}) {
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
          <h2 className="section-title">User Management</h2>
          <p className="section-sub">
            {total} registered users
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
          <table className="tbl">
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td style={{ fontWeight: 500 }}>{u.email}</td>
                  <td>
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
                  <td>
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
                  <td style={{ whiteSpace: "nowrap" }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td>
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
          <p className="table-empty">
            {search ? "No users match your search." : "No users found."}
          </p>
        )}
        <Pagination page={page} pageSize={pageSize} total={total} onPage={onPage} />
      </div>
    </div>
  );
}
