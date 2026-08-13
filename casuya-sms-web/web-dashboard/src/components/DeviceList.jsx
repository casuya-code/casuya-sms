import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

function fmtDate(value) {
  if (!value) return null;
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

const GUIDE_STEPS = [
  {
    title: "Install & sign in",
    body: "Install the Casuya SMS Android app and log in to your account.",
  },
  {
    title: "Copy your credentials",
    body: "In the app's Device Info section, tap Copy ID and Copy Key.",
  },
  {
    title: "Paste below & Link",
    body: "Paste both values into the boxes and click Link Device.",
  },
  {
    title: "Go online",
    body: "Keep the app open. It connects automatically within a few seconds and turns green.",
  },
];

export default function DeviceList() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newDeviceId, setNewDeviceId] = useState("");
  const [newApiKey, setNewApiKey] = useState("");
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

  const link = async () => {
    setRegistering(true);
    setError("");
    try {
      const res = await api.post("/api/devices/link", {
        device_id: newDeviceId.trim(),
        api_key: newApiKey.trim(),
        device_name: newName.trim() || "android",
      });
      setResult(
        `Device linked! ${res.data.device_name || "android"} will go online once the app connects.`
      );
      setNewDeviceId("");
      setNewApiKey("");
      setNewName("");
      load();
    } catch (e) {
      setError(e.response?.data?.error || "failed to link device");
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

  return (
    <section className="dev-card">
      <div className="dev-header">
        <h2 className="dev-title">Devices</h2>
        {devices.length > 0 && (
          <span className="dev-count">
            {online} online &middot; {offline} offline
          </span>
        )}
      </div>

      {error && <p className="dev-error">{error}</p>}
      {result && <p className="dev-success">{result}</p>}

      <div className="dev-link-box">
        <div className="dev-guide-title">Pair a new device</div>
        <ol className="dev-guide">
          {GUIDE_STEPS.map((step, i) => (
            <li key={i} className="dev-guide-step">
              <span className="dev-guide-num">{i + 1}</span>
              <span className="dev-guide-text">
                <strong>{step.title}:</strong> {step.body}
              </span>
            </li>
          ))}
        </ol>
        <div className="dev-link-row">
          <input
            type="text"
            placeholder="Device ID (from app's Copy ID)"
            value={newDeviceId}
            onChange={(e) => setNewDeviceId(e.target.value)}
            className="dev-input dev-input-full"
            disabled={registering}
            autoComplete="off"
          />
        </div>
        <div className="dev-link-row">
          <input
            type="text"
            placeholder="API Key (from app's Copy Key)"
            value={newApiKey}
            onChange={(e) => setNewApiKey(e.target.value)}
            className="dev-input dev-input-full"
            disabled={registering}
            autoComplete="off"
          />
        </div>
        <div className="dev-link-row">
          <input
            type="text"
            placeholder="Device name (optional)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && link()}
            className="dev-input dev-input-full"
            disabled={registering}
          />
          <button
            onClick={link}
            disabled={registering || !newDeviceId.trim() || !newApiKey.trim()}
            className="dev-register-btn"
          >
            {registering ? "Linking..." : "Link Device"}
          </button>
        </div>
      </div>

      {loading && (
        <p className="dev-empty">Loading devices...</p>
      )}

      {!loading && devices.length === 0 && (
        <div className="dev-empty-box">
          <p className="dev-empty-title">No devices linked yet</p>
          <p className="dev-empty-desc">
            Follow the steps above to pair your Android phone. A linked device that never
            connects is removed automatically after 1 hour.
          </p>
        </div>
      )}

      {devices.length > 0 && (
        <ul className="dev-list">
          {devices.map((d) => {
            const isOnline = d.status === "online";
            const isEditing = editingId === d.id;
            const neverConnected = !d.first_connected_at;
            const lastSeen = fmtDate(d.last_heartbeat_at);
            const firstConnected = fmtDate(d.first_connected_at);
            return (
              <li key={d.id} className="dev-item">
                <span
                  className="dev-status-dot"
                  style={{
                    background: isOnline ? "#4caf50" : "#bbb",
                    boxShadow: isOnline ? "0 0 6px #4caf50" : "none",
                  }}
                />
                <div className="dev-info">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") rename(d.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="dev-input dev-input-full"
                      autoFocus
                    />
                  ) : (
                    <>
                      <div className="dev-name">{d.device_name || "Unnamed Device"}</div>
                      <div className="dev-id" title={d.id}>{d.id}</div>
                      <div className="dev-health">
                        {typeof d.battery_level === "number" && (
                          <span className="dev-health-item">
                            Battery {d.battery_level}%{d.is_charging ? " (charging)" : ""}
                          </span>
                        )}
                        {d.signal_strength && (
                          <span className="dev-health-item">Signal {d.signal_strength}</span>
                        )}
                        {isOnline && firstConnected && (
                          <span className="dev-health-item">Connected {firstConnected}</span>
                        )}
                        <span className="dev-health-item">
                          {isOnline ? `Last seen ${lastSeen || "just now"}` : lastSeen ? `Last seen ${lastSeen}` : "Never seen"}
                        </span>
                      </div>
                      {neverConnected && (
                        <div className="dev-warn">
                          Linked but never connected &mdash; removed automatically after 1 hour.
                          Open the app to connect.
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="dev-actions">
                  {isEditing ? (
                    <>
                      <button onClick={() => rename(d.id)} className="dev-btn dev-btn-primary">
                        Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="dev-btn dev-btn-cancel">
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => copyId(d.id)}
                        title="Copy device ID to clipboard"
                        className={`dev-btn ${copiedId === d.id ? "dev-btn-copied" : "dev-btn-copy"}`}
                      >
                        {copiedId === d.id ? "Copied!" : "Copy ID"}
                      </button>
                      <button
                        onClick={() => { setEditingId(d.id); setEditName(d.device_name || ""); }}
                        title="Rename device"
                        className="dev-btn dev-btn-cancel"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => remove(d.id, d.device_name)}
                        title="Delete device"
                        className="dev-btn dev-btn-delete"
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
