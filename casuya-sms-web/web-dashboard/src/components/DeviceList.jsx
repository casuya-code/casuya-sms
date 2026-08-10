import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

export default function DeviceList() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [registering, setRegistering] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [result, setResult] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api.get("/api/devices");
      setDevices(res.data);
      setError("");
    } catch (e) {
      setError(e.response?.data?.error || "failed to load devices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const register = async () => {
    setRegistering(true);
    setError("");
    try {
      const res = await api.post("/api/devices/register", {
        device_name: newName.trim() || "android",
      });
      setResult(`Device registered! ID: ${res.data.deviceId}`);
      setNewName("");
      load();
    } catch (e) {
      setError(e.response?.data?.error || "failed to register device");
    } finally {
      setRegistering(false);
    }
  };

  const rename = async (id) => {
    const name = editName.trim();
    if (!name) return;
    try {
      await api.patch(`/api/devices/${id}`, { device_name: name });
      setEditingId(null);
      setEditName("");
      load();
    } catch (e) {
      setError(e.response?.data?.error || "failed to rename device");
    }
  };

  const remove = async (id, name) => {
    if (!confirm(`Delete device "${name || id.slice(0, 8)}..."?\nThis cannot be undone.`)) return;
    try {
      await api.delete(`/api/devices/${id}`);
      load();
    } catch (e) {
      setError(e.response?.data?.error || "failed to delete device");
    }
  };

  const copyId = (id) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {});
  };

  const online = devices.filter((d) => d.status === "online").length;
  const offline = devices.length - online;

  const card = {
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: 16,
  };

  const inputStyle = {
    padding: "8px 12px",
    fontSize: 14,
    border: "1px solid #ddd",
    borderRadius: 4,
  };

  return (
    <section style={card}>
      <div
        className="flex-header"
        style={{ marginBottom: 14 }}
      >
        <h2 style={{ margin: 0 }}>Devices</h2>
        {devices.length > 0 && (
          <span style={{ fontSize: 13, color: "#888" }}>
            {online} online · {offline} offline
          </span>
        )}
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
      {result && (
        <p
          style={{
            color: "#155724",
            padding: "8px 12px",
            background: "#d4edda",
            borderRadius: 6,
            border: "1px solid #a5d6a7",
            margin: "0 0 12px",
            fontSize: 14,
          }}
        >
          {result}
        </p>
      )}

      <div className="flex-row" style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Device name (optional)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && register()}
          style={{ ...inputStyle, flex: 1 }}
          disabled={registering}
        />
        <button
          onClick={register}
          disabled={registering}
          style={{
            cursor: "pointer",
            padding: "8px 18px",
            background: "#1e88e5",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {registering ? "Registering..." : "Register"}
        </button>
      </div>

      {loading && (
        <p style={{ color: "#888", textAlign: "center", padding: 20 }}>Loading devices...</p>
      )}

      {!loading && devices.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: 30,
            color: "#888",
            background: "#fafafa",
            borderRadius: 6,
          }}
        >
          <p style={{ margin: "0 0 8px", fontSize: 15 }}>No devices registered yet</p>
          <p style={{ margin: 0, fontSize: 13 }}>
            Register one above, then connect your Android device with the same device ID.
          </p>
        </div>
      )}

      {devices.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {devices.map((d) => {
            const isOnline = d.status === "online";
            const isEditing = editingId === d.id;
            return (
              <li
                key={d.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 0",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: isOnline ? "#4caf50" : "#bbb",
                    flexShrink: 0,
                    boxShadow: isOnline ? "0 0 6px #4caf50" : "none",
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") rename(d.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      style={{ ...inputStyle, width: "100%" }}
                      autoFocus
                    />
                  ) : (
                    <>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {d.device_name || "Unnamed Device"}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontFamily: "monospace",
                          color: "#aaa",
                          marginTop: 2,
                        }}
                        title={d.id}
                      >
                        {d.id}
                      </div>
                    </>
                  )}
                </div>
                <div className="device-actions" style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => rename(d.id)}
                        style={{
                          cursor: "pointer",
                          padding: "5px 12px",
                          fontSize: 12,
                          background: "#1e88e5",
                          color: "#fff",
                          border: "none",
                          borderRadius: 4,
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        style={{
                          cursor: "pointer",
                          padding: "5px 12px",
                          fontSize: 12,
                          background: "#f5f5f5",
                          border: "1px solid #ddd",
                          borderRadius: 4,
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => copyId(d.id)}
                        title="Copy device ID to clipboard"
                        style={{
                          cursor: "pointer",
                          padding: "5px 10px",
                          fontSize: 12,
                          background: copiedId === d.id ? "#4caf50" : "#f5f5f5",
                          color: copiedId === d.id ? "#fff" : "#555",
                          border: `1px solid ${copiedId === d.id ? "#4caf50" : "#ddd"}`,
                          borderRadius: 4,
                        }}
                      >
                        {copiedId === d.id ? "Copied!" : "Copy ID"}
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(d.id);
                          setEditName(d.device_name || "");
                        }}
                        title="Rename device"
                        style={{
                          cursor: "pointer",
                          padding: "5px 10px",
                          fontSize: 12,
                          background: "#f5f5f5",
                          border: "1px solid #ddd",
                          borderRadius: 4,
                        }}
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => remove(d.id, d.device_name)}
                        title="Delete device"
                        style={{
                          cursor: "pointer",
                          padding: "5px 10px",
                          fontSize: 12,
                          color: "#d32f2f",
                          background: "none",
                          border: "1px solid #ef9a9a",
                          borderRadius: 4,
                        }}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
