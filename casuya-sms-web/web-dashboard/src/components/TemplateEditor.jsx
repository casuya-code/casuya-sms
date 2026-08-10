import { useState, useMemo } from "react";

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "academic", label: "Academic" },
  { value: "finance", label: "Finance" },
  { value: "attendance", label: "Attendance" },
  { value: "discipline", label: "Discipline" },
  { value: "emergency", label: "Emergency" },
  { value: "events", label: "School Events" },
  { value: "health", label: "Health" },
];

const SAMPLE_DATA = {
  name: "John Peter Mwangi",
  phone: "0712345678",
  date: "3 Oktoba 2026",
  text: "Mid-term",
  text_1: "Mid-term",
  text_2: "saa 2 asubuhi",
  numeric: "BIO: 85, CHE: 92, ENG: 76, MAT: 88",
  numeric_1: "85",
  computed: "Jumla: 844, Wastani: 84, Daraja: A, Nafasi: 3",
};

const VAR_TABLE = [
  { var: "{name}", type: "name", matches: "Any column with 'name', 'jina', 'first', 'last', 'surname' in header", example: "F.Name + M.Name + Surname → 'John Peter Mwangi'" },
  { var: "{phone}", type: "phone", matches: "Any column with 'number', 'phone', 'simu', 'namba', 'tel' in header", example: "Number → '0712345678'" },
  { var: "{date}", type: "date", matches: "Any column with 'date', 'tarehe', 'siku', 'mwaka' in header", example: "Tarehe → '3 Oktoba 2026'" },
  { var: "{text}", type: "text", matches: "First non-numeric, non-name, non-date column", example: "Mada → 'Mid-term'" },
  { var: "{text_1}", type: "text", matches: "First text column (numbered)", example: "Mada → 'Mid-term'" },
  { var: "{text_2}", type: "text", matches: "Second text column (numbered)", example: "Muda → 'saa 2 asubuhi'" },
  { var: "{numeric}", type: "numeric", matches: "All numeric columns combined (scores, amounts)", example: "BIO: 85, CHE: 92, ENG: 76, MAT: 88" },
  { var: "{numeric_1}", type: "numeric", matches: "First numeric column only", example: "85" },
  { var: "{computed}", type: "computed", matches: "TOT, AVR, GRD, POS, COM, REMARKS columns", example: "Jumla: 844, Wastani: 84, Daraja: A, Nafasi: 3" },
];

function Preview({ message }) {
  const preview = useMemo(() => {
    if (!message) return "";
    let result = message;
    result = result.replace(/\{name\}/g, SAMPLE_DATA.name);
    result = result.replace(/\{phone\}/g, SAMPLE_DATA.phone);
    result = result.replace(/\{date\}/g, SAMPLE_DATA.date);
    result = result.replace(/\{numeric\}/g, SAMPLE_DATA.numeric);
    result = result.replace(/\{computed\}/g, SAMPLE_DATA.computed);
    result = result.replace(/\{(text)\}/g, SAMPLE_DATA.text);
    result = result.replace(/\{text_1\}/g, SAMPLE_DATA.text_1);
    result = result.replace(/\{text_2\}/g, SAMPLE_DATA.text_2);
    result = result.replace(/\{numeric_1\}/g, SAMPLE_DATA.numeric_1);
    return result;
  }, [message]);

  if (!message) return null;

  const hasVars = /\{(name|phone|date|text|text_\d+|numeric|numeric_\d+|computed)\}/.test(message);

  return (
    <div style={{ background: "#e8f5e9", border: "1px solid #a5d6a7", borderRadius: 6, padding: 12, marginTop: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#2e7d32", marginBottom: 6 }}>
        Live Preview (with sample data)
      </div>
      <div style={{ fontSize: 13, color: "#333", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
        {preview}
      </div>
      {!hasVars && message.length > 0 && (
        <div style={{ fontSize: 11, color: "#e65100", marginTop: 6 }}>
          Tip: Use {"{name}"}, {"{date}"}, {"{text}"}, {"{numeric}"} as placeholders
        </div>
      )}
    </div>
  );
}

export default function TemplateEditor({ template, onSave, onCancel }) {
  const [name, setName] = useState(template?.name || "");
  const [category, setCategory] = useState(template?.category || "general");
  const [message, setMessage] = useState(template?.message || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Template name is required"); return; }
    if (!message.trim()) { setError("Message is required"); return; }
    setSaving(true);
    setError("");
    try {
      await onSave({ name: name.trim(), category, message });
    } catch (e) {
      setError(e.response?.data?.error || "failed to save");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    padding: "10px 12px",
    fontSize: 14,
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #ddd",
    borderRadius: 4,
  };

  return (
    <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>{template ? "Edit Template" : "New Template"}</h2>

      {error && (
        <p style={{ color: "#d32f2f", padding: "8px 12px", background: "#ffebee", borderRadius: 6, border: "1px solid #ef9a9a", margin: "0 0 12px", fontSize: 14 }}>
          {error}
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
        <div className="flex-row">
          <input
            type="text"
            placeholder="Template name (e.g. Exam Results)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ ...inputStyle, flex: 2 }}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 4 }}>
            Message Template
          </label>
          <textarea
            placeholder={'Type your message here.\n\nExample:\nHabari, mwanafunzi {name} amepata alama zifuatazo: {numeric}. {computed}.\n\nUse placeholders: {name}, {date}, {text}, {numeric}, {computed}'}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", fontSize: 13 }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontSize: 12, color: "#888" }}>{message.length}/1500 chars</span>
            {message.length > 1500 && <span style={{ fontSize: 12, color: "#d32f2f" }}>Too long!</span>}
          </div>
        </div>

        <Preview message={message} />

        <div style={{ background: "#f8f9fa", border: "1px solid #e0e0e0", borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            Available Variables — system auto-fills from your CSV columns
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "2px solid #ddd", fontWeight: 600 }}>Variable</th>
                  <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "2px solid #ddd", fontWeight: 600 }}>What It Matches</th>
                  <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "2px solid #ddd", fontWeight: 600 }}>Example</th>
                </tr>
              </thead>
              <tbody>
                {VAR_TABLE.map((v) => (
                  <tr key={v.var}>
                    <td style={{ padding: "6px 8px", borderBottom: "1px solid #eee" }}>
                      <code style={{ background: "#e3f2fd", padding: "1px 5px", borderRadius: 3, fontWeight: 600 }}>{v.var}</code>
                    </td>
                    <td style={{ padding: "6px 8px", borderBottom: "1px solid #eee", color: "#555" }}>{v.matches}</td>
                    <td style={{ padding: "6px 8px", borderBottom: "1px solid #eee", color: "#888", fontFamily: "monospace" }}>{v.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex-row">
        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            cursor: "pointer",
            padding: "10px 24px",
            fontSize: 14,
            fontWeight: 600,
            background: "#1e88e5",
            color: "#fff",
            border: "none",
            borderRadius: 4,
          }}
        >
          {saving ? "Saving..." : "Save Template"}
        </button>
        <button
          onClick={onCancel}
          style={{
            cursor: "pointer",
            padding: "10px 24px",
            fontSize: 14,
            background: "#f5f5f5",
            border: "1px solid #ddd",
            borderRadius: 4,
          }}
        >
          Cancel
        </button>
      </div>
    </section>
  );
}
