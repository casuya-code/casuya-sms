import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import TemplateEditor from "./TemplateEditor";
import BulkSend from "./BulkSend";

const CATEGORY_ICONS = {
  general: "📝",
  academic: "📊",
  finance: "💰",
  attendance: "📋",
  discipline: "⚠️",
  emergency: "🚨",
  events: "📅",
  health: "❤️",
};

export default function TemplateList() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("list");
  const [editing, setEditing] = useState(null);
  const [sending, setSending] = useState(null);

  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/api/templates");
      if (!mountedRef.current) return;
      setTemplates(res.data);
      setError("");
    } catch (e) {
      if (!mountedRef.current) return;
      setError(e.response?.data?.error || "failed to load templates");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (id, name) => {
    if (!confirm(`Delete template "${name}"?`)) return;
    try {
      await api.delete(`/api/templates/${id}`);
      load();
    } catch (e) {
      setError(e.response?.data?.error || "failed to delete template");
    }
  };

  const handleSave = async (data) => {
    if (editing) {
      await api.patch(`/api/templates/${editing.id}`, data);
    } else {
      await api.post("/api/templates", data);
    }
    setView("list");
    setEditing(null);
    load();
  };

  if (view === "editor") {
    return (
      <TemplateEditor
        template={editing}
        onSave={handleSave}
        onCancel={() => { setView("list"); setEditing(null); }}
      />
    );
  }

  if (view === "send" && sending) {
    return (
      <BulkSend
        template={sending}
        onDone={() => { setView("list"); setSending(null); }}
        onBack={() => { setView("list"); setSending(null); }}
      />
    );
  }

  const card = {
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: 16,
  };

  return (
    <section style={card}>
      <div className="flex-header" style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>SMS Templates</h2>
        <button
          onClick={() => { setEditing(null); setView("editor"); }}
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
          + New Template
        </button>
      </div>

      {error && (
        <p style={{ color: "#d32f2f", padding: "8px 12px", background: "#ffebee", borderRadius: 6, border: "1px solid #ef9a9a", margin: "0 0 12px", fontSize: 14 }}>
          {error}
        </p>
      )}

      {loading && (
        <p style={{ color: "#888", textAlign: "center", padding: 20 }}>Loading templates...</p>
      )}

      {!loading && templates.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "#888", background: "#fafafa", borderRadius: 6 }}>
          <p style={{ margin: "0 0 8px", fontSize: 15 }}>No templates yet</p>
          <p style={{ margin: 0, fontSize: 13 }}>Create one above, then use it for bulk SMS sends.</p>
        </div>
      )}

      {!loading && templates.length > 0 && (
        <div className="template-grid">
          {templates.map((t) => (
            <div
              key={t.id}
              className="template-card"
              onClick={() => { setEditing(t); setView("editor"); }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{CATEGORY_ICONS[t.category] || "📝"}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "#888", textTransform: "capitalize" }}>{t.category}</div>
                  </div>
                </div>
              </div>
              <p style={{ margin: "0 0 12px", fontSize: 13, color: "#555", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                {t.message}
              </p>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setEditing(t); setView("editor"); }}
                  style={{ cursor: "pointer", padding: "5px 12px", fontSize: 12, background: "#f5f5f5", border: "1px solid #ddd", borderRadius: 4 }}
                >
                  Edit
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setSending(t); setView("send"); }}
                  style={{ cursor: "pointer", padding: "5px 12px", fontSize: 12, background: "#1e88e5", color: "#fff", border: "none", borderRadius: 4 }}
                >
                  Send
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); remove(t.id, t.name); }}
                  style={{ cursor: "pointer", padding: "5px 12px", fontSize: 12, color: "#d32f2f", background: "none", border: "1px solid #ef9a9a", borderRadius: 4 }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
