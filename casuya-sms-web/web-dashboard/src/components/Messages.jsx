import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../lib/api";

const TYPE_LABELS = {
  1: { label: "Inbox", bg: "#e3f2fd", color: "#0d47a1" },
  2: { label: "Sent", bg: "#e8f5e9", color: "#1b5e20" },
  3: { label: "Draft", bg: "#f3e5f5", color: "#4a148c" },
  4: { label: "Outbox", bg: "#fff3e0", color: "#e65100" },
  5: { label: "Failed", bg: "#fce4ec", color: "#880e4f" },
  6: { label: "Queued", bg: "#fff8e1", color: "#8d6e63" },
};

function TypeBadge({ type }) {
  const t = TYPE_LABELS[type] || { label: `Type ${type}`, bg: "#e2e3e5", color: "#383d41" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
        background: t.bg,
        color: t.color,
      }}
    >
      {t.label}
    </span>
  );
}

const PAGE_SIZE = 100;

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [deletingId, setDeletingId] = useState(null);
  const [clearingAll, setClearingAll] = useState(false);
  const searchTimer = useRef(null);

  const load = useCallback(async () => {
    try {
      const params = { limit: PAGE_SIZE, offset };
      if (type) params.type = type;
      if (search.trim()) params.search = search.trim();
      const countParams = {};
      if (type) countParams.type = type;
      if (search.trim()) countParams.search = search.trim();
      const [listRes, countRes] = await Promise.all([
        api.get("/api/messages", { params }),
        api.get("/api/messages/count", { params: countParams }),
      ]);
      setMessages(listRes.data);
      setCount(countRes.data.count);
      setError("");
    } catch (e) {
      setError(e.response?.data?.error || "failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [type, search, offset]);

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

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setOffset(0), 400);
  };

  const clearSearch = () => {
    setSearch("");
    setOffset(0);
  };

  const changeType = (t) => {
    setType(t);
    setOffset(0);
  };

  const deleteOne = async (id) => {
    if (!confirm("Delete this message?")) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/messages/${id}`);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (count !== null) setCount(count - 1);
    } catch (e) {
      setError(e.response?.data?.error || "failed to delete message");
    } finally {
      setDeletingId(null);
    }
  };

  const clearAll = async () => {
    if (!confirm("Delete ALL synced messages? This cannot be undone.")) return;
    setClearingAll(true);
    try {
      const res = await api.delete("/api/messages");
      setMessages([]);
      setCount(0);
      alert(`Deleted ${res.data.deleted} message(s).`);
    } catch (e) {
      setError(e.response?.data?.error || "failed to clear messages");
    } finally {
      setClearingAll(false);
    }
  };

  const hasMore = count !== null && offset + messages.length < count;
  const totalPages = count !== null ? Math.ceil(count / PAGE_SIZE) : 0;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  const selectStyle = {
    padding: "8px 10px",
    fontSize: 14,
    border: "1px solid #ddd",
    borderRadius: 4,
    background: "#fff",
  };

  return (
    <section className="logs-card">
      <div className="logs-header">
        <h2 className="logs-title">All Messages</h2>
        <div className="logs-controls">
          {count !== null && <span className="logs-count">{count.toLocaleString()} message(s)</span>}
          {messages.length > 0 && (
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

      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <select value={type} onChange={(e) => changeType(e.target.value)} style={selectStyle}>
          <option value="">All types</option>
          <option value="1">Inbox</option>
          <option value="2">Sent</option>
          <option value="3">Draft</option>
          <option value="4">Outbox</option>
          <option value="5">Failed</option>
          <option value="6">Queued</option>
        </select>
        <input
          type="text"
          placeholder="Search number or message content..."
          value={search}
          onChange={handleSearchChange}
          style={{
            flex: 1,
            minWidth: 200,
            padding: "8px 12px",
            fontSize: 14,
            border: "1px solid #ddd",
            borderRadius: 4,
          }}
        />
        {search && (
          <button onClick={clearSearch} className="logs-clear-btn">
            Clear
          </button>
        )}
      </div>

      {error && <p className="logs-error">{error}</p>}

      {loading && messages.length === 0 && <p className="logs-empty">Loading messages...</p>}

      {!loading && messages.length === 0 && (
        <p className="logs-empty">
          No messages synced yet. Make sure your Android device is connected and has run a sync.
        </p>
      )}

      {messages.length > 0 && (
        <>
          <div className="logs-table-wrap">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>From / To</th>
                  <th>Message</th>
                  <th>Type</th>
                  <th>Device</th>
                  <th>Time</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {messages.map((m) => (
                  <tr key={m.id}>
                    <td className="logs-td-id">{m.id}</td>
                    <td className="logs-td-to">{m.from_number || "\u2014"}</td>
                    <td className="logs-td-msg" title={m.body}>{m.body || "\u2014"}</td>
                    <td><TypeBadge type={m.type} /></td>
                    <td className="logs-td-device" title={m.device_id}>
                      {m.device_id ? m.device_id.slice(0, 8) + "..." : "\u2014"}
                    </td>
                    <td className="logs-td-time">
                      {m.timestamp ? new Date(m.timestamp).toLocaleString() : new Date(m.created_at).toLocaleString()}
                    </td>
                    <td className="logs-td-actions">
                      <button
                        onClick={() => deleteOne(m.id)}
                        disabled={deletingId === m.id}
                        className="logs-delete-btn"
                        title="Delete this message"
                      >
                        {deletingId === m.id ? "..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="logs-mobile-cards">
            {messages.map((m) => (
              <div key={m.id} className="logs-mobile-card">
                <div className="logs-mobile-top">
                  <span className="logs-mobile-id">#{m.id}</span>
                  <TypeBadge type={m.type} />
                </div>
                <div className="logs-mobile-to">{m.from_number || "\u2014"}</div>
                <div className="logs-mobile-msg" title={m.body}>{m.body || "\u2014"}</div>
                <div className="logs-mobile-bottom">
                  <span className="logs-mobile-device" title={m.device_id}>
                    {m.device_id ? m.device_id.slice(0, 8) + "..." : "\u2014"}
                  </span>
                  <span className="logs-mobile-time">
                    {m.timestamp ? new Date(m.timestamp).toLocaleString() : new Date(m.created_at).toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => deleteOne(m.id)}
                  disabled={deletingId === m.id}
                  className="logs-delete-btn logs-delete-mobile"
                  title="Delete this message"
                >
                  {deletingId === m.id ? "..." : "Delete"}
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 13, color: "#666" }}>
              Page {currentPage} of {totalPages || 1} &middot; {count.toLocaleString()} total
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                disabled={offset === 0}
                className="logs-refresh-btn"
              >
                Prev
              </button>
              <button
                onClick={() => setOffset(offset + PAGE_SIZE)}
                disabled={!hasMore}
                className="logs-refresh-btn"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}