import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api";
import { getActiveApiKey } from "./ApiKeyManager";

const PREVIEW_ROWS = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const RECIPIENT_HINTS = ["phone","phonenumber","phone_number","mobile","number","simu","namba","tel","to","contact","recipient"];

function isPlausiblePhone(raw) {
  if (!raw) return false;
  const digits = raw.replace(/[^0-9+]/g, "");
  if (digits.length < 6 || digits.length > 16) return false;
  return /^\+?[0-9]{6,15}$/.test(digits);
}

function normalizePhone(raw) {
  return raw.replace(/[^0-9+]/g, "");
}

function detectPhoneColumn(columns) {
  const lower = columns.map((c) => c.toLowerCase().replace(/[\s_-]+/g, ""));
  for (const hint of RECIPIENT_HINTS) {
    const idx = lower.indexOf(hint);
    if (idx !== -1) return columns[idx];
  }
  for (const hint of RECIPIENT_HINTS) {
    const idx = lower.findIndex((c) => c.includes(hint));
    if (idx !== -1) return columns[idx];
  }
  return "";
}

function detectColumnType(col, rows) {
  const vals = rows.slice(0, 20).map((r) => String(r[col] || "").trim());
  if (/name|jina|first|last|surname/i.test(col)) return { color: "#1565c0", label: "name" };
  if (/number|phone|simu|namba|tel|to/i.test(col)) return { color: "#2e7d32", label: "phone" };
  if (/date|tarehe|siku|mwaka/i.test(col)) return { color: "#c62828", label: "date" };
  if (/sex|gender|jinsia/i.test(col)) return { color: "#6a1b9a", label: "text" };
  if (/^(tot|totl|total|avr|avg|average|grd|grade|gde|pos|position|pst|com|comment|comments|remarks|rmk)$/i.test(col)) return { color: "#9c27b0", label: "computed" };
  const allNum = vals.length > 0 && vals.every((v) => v !== "" && !isNaN(Number(v)));
  if (allNum) return { color: "#e65100", label: "numeric" };
  return { color: "#888", label: "text" };
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function fillTemplate(tpl, row) {
  return tpl.replace(/\{(\w+)\}/g, (_, key) => row[key] ?? "");
}

function StepShell({ step, title, description, locked, complete, children }) {
  return (
    <section style={{
      border: "1px solid #e0e0e0", borderRadius: 8, padding: 16, marginBottom: 12,
      opacity: locked ? 0.55 : 1, pointerEvents: locked ? "none" : "auto",
      transition: "opacity 0.2s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 600, flexShrink: 0,
          background: complete ? "#1e88e5" : "#fff", color: complete ? "#fff" : "#1e88e5",
          border: complete ? "none" : "2px solid #1e88e5",
        }}>
          {complete ? "\u2713" : step}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
          {description && <div style={{ fontSize: 12, color: "#888" }}>{description}</div>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function BulkSend({ template, standalone, onDone, onBack }) {
  const [step, setStep] = useState(1);
  const [devices, setDevices] = useState([]);
  const [csvText, setCsvText] = useState("");
  const [parsed, setParsed] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [recipientColumn, setRecipientColumn] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [message, setMessage] = useState(template?.message || "");
  const [previewIndex, setPreviewIndex] = useState(0);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState(null);
  const textareaRef = useRef(null);

  const loadDevices = useCallback(async () => {
    try { const res = await api.get("/api/devices"); setDevices(res.data); } catch {}
  }, []);

  useEffect(() => { loadDevices(); }, [loadDevices]);

  const onlineDevices = devices.filter((d) => d.status === "online");
  const apiKey = getActiveApiKey();
  const selectedDevice = devices.find((d) => d.id === deviceId);

  const parseCSV = useCallback((text) => {
    const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) { setParsed(null); return; }
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      if (cols.length === headers.length) {
        const row = {};
        headers.forEach((h, j) => { row[h] = cols[j]; });
        rows.push(row);
      }
    }
    setParsed({ headers, rows });
    setRecipientColumn(detectPhoneColumn(headers));
    setFileName(null);
    setPreviewIndex(0);
    setFileError(null);
  }, []);

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setFileError("File too large (" + formatFileSize(file.size) + "). Max: " + formatFileSize(MAX_FILE_SIZE));
      return;
    }
    setFileName(file.name);
    setFileError(null);
    const reader = new FileReader();
    reader.onload = (e) => { setCsvText(e.target.result); parseCSV(e.target.result); };
    reader.readAsText(file);
  }, [parseCSV]);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const plan = useMemo(() => {
    if (!parsed || !recipientColumn) return { valid: [], excluded: [], counts: null };
    const valid = [], excluded = [];
    const seen = new Set();
    parsed.rows.forEach((row, i) => {
      const raw = String(row[recipientColumn] || "").trim();
      if (!raw) { excluded.push({ row: i + 2, raw, reason: "empty" }); return; }
      if (!isPlausiblePhone(raw)) { excluded.push({ row: i + 2, raw, reason: "invalid" }); return; }
      const norm = normalizePhone(raw);
      if (seen.has(norm)) { excluded.push({ row: i + 2, raw, reason: "duplicate" }); return; }
      seen.add(norm);
      valid.push({ rowNumber: i + 2, raw, data: row });
    });
    const counts = {
      total: parsed.rows.length, valid: valid.length,
      empty: excluded.filter((e) => e.reason === "empty").length,
      invalid: excluded.filter((e) => e.reason === "invalid").length,
      duplicate: excluded.filter((e) => e.reason === "duplicate").length,
    };
    return { valid, excluded, counts };
  }, [parsed, recipientColumn]);

  const safePreviewIndex = Math.min(previewIndex, Math.max(0, plan.valid.length - 1));
  const previewRow = plan.valid[safePreviewIndex];
  const previewMessage = previewRow ? fillTemplate(message, previewRow.data) : "";

  const messageRef = useRef(message);
  messageRef.current = message;

  const insertVariable = useCallback((col) => {
    const el = textareaRef.current;
    const token = "{" + col + "}";
    if (!el) { setMessage((t) => t + token); return; }
    const start = el.selectionStart ?? messageRef.current.length;
    const end = el.selectionEnd ?? messageRef.current.length;
    const next = messageRef.current.slice(0, start) + token + messageRef.current.slice(end);
    setMessage(next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start + token.length, start + token.length); });
  }, []);

  const hasFile = parsed && parsed.rows.length > 0;
  const mapped = hasFile && recipientColumn && plan.valid.length > 0;
  const composed = mapped && message.trim().length > 0 && deviceId;

  const send = async () => {
    if (!composed || plan.valid.length === 0) return;
    setSending(true);
    setError("");

    try {
      let res;
      if (template && template.id) {
        const rows = plan.valid.map((r) => r.data);
        res = await api.post("/api/templates/" + template.id + "/send", { rows, device_id: deviceId });
      } else {
        const messages = plan.valid.map((r) => ({
          to: normalizePhone(r.raw),
          message: fillTemplate(message, r.data),
        }));
        res = await api.post("/api/v1/bulk", { messages, device_id: deviceId }, {
          headers: apiKey ? { "X-API-KEY": apiKey } : {},
        });
      }
      setResult(res.data);
    } catch (e) {
      setError(e.response?.data?.error || "Bulk send failed");
    }
    setSending(false);
  };

  const th = { textAlign: "left", padding: "8px 10px", borderBottom: "2px solid #e0e0e0", fontSize: 12, fontWeight: 600, color: "#666", whiteSpace: "nowrap" };
  const td = { padding: "8px 10px", borderBottom: "1px solid #f0f0f0", fontSize: 13, whiteSpace: "nowrap" };

  if (result) {
    return (
      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
        <h2 style={{ margin: "0 0 16px" }}>Bulk Send Complete</h2>
        <div style={{ padding: 16, borderRadius: 8, background: "#e8f5e9", border: "1px solid #a5d6a7", marginBottom: 12 }}>
          <div style={{ fontWeight: 600, color: "#2e7d32", marginBottom: 8, fontSize: 16 }}>Results</div>
          <div style={{ fontSize: 14, color: "#555" }}>
            Total: <strong>{result.total}</strong> &middot; Sent: <strong style={{ color: "#2e7d32" }}>{result.sent}</strong> &middot; Failed: <strong style={{ color: result.failed > 0 ? "#d32f2f" : "#555" }}>{result.failed}</strong>
          </div>
        </div>
        {result.results && result.results.filter((r) => r.status === "failed").length > 0 && (
          <details style={{ marginBottom: 12 }}>
            <summary style={{ cursor: "pointer", fontSize: 13, color: "#888" }}>
              {result.results.filter((r) => r.status === "failed").length} failed messages
            </summary>
            <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
              {result.results.filter((r) => r.status === "failed").slice(0, 20).map((r, i) => (
                <div key={i} style={{ padding: "4px 0", borderBottom: "1px solid #f0f0f0" }}>
                  <strong>{r.to}</strong>: {r.error}
                </div>
              ))}
            </div>
          </details>
        )}
        <button onClick={() => { setResult(null); setStep(1); setSending(false); }} style={{ cursor: "pointer", padding: "8px 20px", fontSize: 14, fontWeight: 600, background: "#1e88e5", color: "#fff", border: "none", borderRadius: 4 }}>Send More</button>
      </section>
    );
  }

  return (
    <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={{ cursor: "pointer", padding: "6px 12px", fontSize: 13, background: "#f5f5f5", border: "1px solid #ddd", borderRadius: 4 }}>&larr; Back</button>
        <h2 style={{ margin: 0, flex: 1 }}>{standalone ? "Quick Bulk Send" : "Bulk Send: " + (template?.name || "")}</h2>
      </div>

      {error && <div style={{ padding: "8px 12px", background: "#ffebee", borderRadius: 6, border: "1px solid #ef9a9a", marginBottom: 12, fontSize: 14, color: "#d32f2f" }}>{error}</div>}

      {!onlineDevices.length && (
        <div style={{ padding: 12, background: "#fff3e0", border: "1px solid #ffcc80", borderRadius: 6, marginBottom: 12, fontSize: 14 }}>
          No devices online. Connect your Android device first.
        </div>
      )}

      {standalone && !apiKey && (
        <div style={{ padding: 12, background: "#fff3cd", border: "1px solid #ffc107", borderRadius: 6, marginBottom: 12, fontSize: 14 }}>
          You need an API key. Generate one in the <strong>API Keys</strong> section first.
        </div>
      )}

      {/* STEP 1: Upload */}
      <StepShell step={1} title="Upload your CSV" description="One row per recipient, with a header row" complete={hasFile}>
        {hasFile ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#f8f9fa", border: "1px solid #e0e0e0", borderRadius: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{fileName || "Pasted data"}</span>
              <span style={{ fontSize: 12, color: "#888" }}>{parsed.rows.length} rows, {parsed.headers.length} columns</span>
              <button onClick={() => { setParsed(null); setFileName(null); setCsvText(""); setRecipientColumn(""); }} style={{ cursor: "pointer", padding: "2px 8px", fontSize: 12, background: "none", border: "1px solid #ddd", borderRadius: 4, color: "#888" }}>&times;</button>
            </div>
            <div style={{ border: "1px solid #e0e0e0", borderRadius: 6, overflow: "hidden", marginBottom: 8 }}>
              <div style={{ maxHeight: 200, overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
                    <tr>{parsed.headers.map((h) => <th key={h} style={th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {parsed.rows.slice(0, PREVIEW_ROWS).map((row, i) => (
                      <tr key={i}>{parsed.headers.map((h) => <td key={h} style={td}>{row[h] || "-"}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {parsed.rows.length > PREVIEW_ROWS && (
              <div style={{ fontSize: 12, color: "#888" }}>Showing first {PREVIEW_ROWS} of {parsed.rows.length} rows.</div>
            )}
          </div>
        ) : (
          <div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{ border: "2px dashed " + (dragOver ? "#1e88e5" : "#ddd"), borderRadius: 8, padding: 30, textAlign: "center", background: dragOver ? "#e3f2fd" : "#fafafa", marginBottom: 12, transition: "all 0.15s" }}
            >
              <p style={{ margin: "0 0 8px", fontSize: 14, color: "#555" }}>Drag & drop a CSV file here, or</p>
              <label style={{ cursor: "pointer", color: "#1e88e5", fontSize: 14, fontWeight: 600, textDecoration: "underline" }}>
                browse files
                <input type="file" accept=".csv,.tsv,.txt" onChange={(e) => handleFile(e.target.files[0])} style={{ display: "none" }} />
              </label>
              <p style={{ margin: "8px 0 0", fontSize: 12, color: "#999" }}>Max {formatFileSize(MAX_FILE_SIZE)}</p>
            </div>
            <textarea
              placeholder={"Or paste CSV data here...\nName,Phone,Date\nJohn Mwangi,0712345678,2026-09-01\nAmina Kimaro,0787654321,2026-09-01"}
              value={csvText}
              onChange={(e) => { setCsvText(e.target.value); parseCSV(e.target.value); }}
              rows={5}
              style={{ padding: "10px 12px", fontSize: 12, width: "100%", boxSizing: "border-box", border: "1px solid #ddd", borderRadius: 4, fontFamily: "monospace", resize: "vertical" }}
            />
          </div>
        )}
        {fileError && <div style={{ padding: "8px 12px", background: "#ffebee", borderRadius: 6, border: "1px solid #ef9a9a", marginTop: 8, fontSize: 13, color: "#d32f2f" }}>{fileError}</div>}
      </StepShell>

      {/* STEP 2: Map */}
      <StepShell step={2} title="Choose the phone column and device" description="Select which column has phone numbers" locked={!hasFile} complete={mapped && Boolean(deviceId)}>
        {hasFile && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4 }}>Phone number column</label>
              <select value={recipientColumn} onChange={(e) => { setRecipientColumn(e.target.value); setPreviewIndex(0); }} style={{ padding: "8px 12px", fontSize: 13, width: "100%", boxSizing: "border-box", border: "1px solid #ddd", borderRadius: 4, background: "#fff" }}>
                <option value="">Select a column...</option>
                {parsed.headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4 }}>Send from device</label>
              <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)} style={{ padding: "8px 12px", fontSize: 13, width: "100%", boxSizing: "border-box", border: "1px solid #ddd", borderRadius: 4, background: "#fff" }}>
                <option value="">Select a device...</option>
                {onlineDevices.map((d) => <option key={d.id} value={d.id}>{d.name || d.id.slice(0, 8)}</option>)}
              </select>
            </div>
          </div>
        )}
        {plan.counts && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600, background: "#e8f5e9", color: "#2e7d32" }}>{plan.counts.valid.toLocaleString()} will receive</span>
            {plan.counts.empty > 0 && <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600, background: "#f5f5f5", color: "#888" }}>{plan.counts.empty} empty</span>}
            {plan.counts.invalid > 0 && <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600, background: "#fff3e0", color: "#e65100" }}>{plan.counts.invalid} invalid</span>}
            {plan.counts.duplicate > 0 && <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600, background: "#fff3e0", color: "#e65100" }}>{plan.counts.duplicate} duplicate</span>}
          </div>
        )}
        {recipientColumn && plan.valid.length === 0 && (
          <div style={{ padding: "8px 12px", background: "#ffebee", borderRadius: 6, border: "1px solid #ef9a9a", marginTop: 8, fontSize: 13, color: "#d32f2f" }}>
            No usable phone numbers in &quot;{recipientColumn}&quot;. Pick a different column.
          </div>
        )}
      </StepShell>

      {/* STEP 3: Compose */}
      <StepShell step={3} title="Write your message" description="Insert a column to personalise each message" locked={!mapped || !deviceId} complete={composed}>
        {parsed && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {parsed.headers.map((col) => {
              const t = detectColumnType(col, parsed.rows);
              return (
                <button key={col} onClick={() => insertVariable(col)} style={{ cursor: "pointer", padding: "4px 10px", fontSize: 12, borderRadius: 4, border: "1px solid " + t.color + "33", background: "#fff", color: t.color, fontWeight: 600 }} onMouseEnter={(e) => { e.currentTarget.style.background = t.color + "11"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}>
                  {"{" + col + "}"}
                </button>
              );
            })}
          </div>
        )}
        <textarea ref={textareaRef} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={"Hi {name}, your order {text_1} is ready!"} rows={4} style={{ padding: "10px 12px", fontSize: 13, width: "100%", boxSizing: "border-box", border: "1px solid #ddd", borderRadius: 4, fontFamily: "monospace", resize: "vertical" }} />
        <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{message.length}/1500 chars</div>
        {previewRow && message && (
          <div style={{ marginTop: 12, background: "#f8f9fa", border: "1px solid #e0e0e0", borderRadius: 6, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>Preview for {previewRow.raw}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button onClick={() => setPreviewIndex(Math.max(0, safePreviewIndex - 1))} disabled={safePreviewIndex === 0} style={{ cursor: safePreviewIndex > 0 ? "pointer" : "not-allowed", padding: "2px 8px", fontSize: 12, background: "#fff", border: "1px solid #ddd", borderRadius: 4, color: safePreviewIndex > 0 ? "#333" : "#bbb" }}>&larr;</button>
                <span style={{ fontSize: 12, color: "#888" }}>{safePreviewIndex + 1} / {plan.valid.length}</span>
                <button onClick={() => setPreviewIndex(Math.min(plan.valid.length - 1, safePreviewIndex + 1))} disabled={safePreviewIndex >= plan.valid.length - 1} style={{ cursor: safePreviewIndex < plan.valid.length - 1 ? "pointer" : "not-allowed", padding: "2px 8px", fontSize: 12, background: "#fff", border: "1px solid #ddd", borderRadius: 4, color: safePreviewIndex < plan.valid.length - 1 ? "#333" : "#bbb" }}>&rarr;</button>
              </div>
            </div>
            <div style={{ fontSize: 13, color: "#333", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{previewMessage}</div>
          </div>
        )}
      </StepShell>

      {/* STEP 4: Review & Send */}
      <StepShell step={4} title="Review and send" description="Nothing is sent until you confirm" locked={!composed}>
        <div style={{ padding: 12, background: "#f8f9fa", border: "1px solid #e0e0e0", borderRadius: 6, marginBottom: 12, fontSize: 14 }}>
          Sending <strong>{plan.valid.length.toLocaleString()} messages</strong> from <strong>{selectedDevice ? (selectedDevice.name || selectedDevice.id.slice(0, 8)) : "your device"}</strong>.
          {plan.excluded.length > 0 && (
            <details style={{ marginTop: 8 }}>
              <summary style={{ cursor: "pointer", fontSize: 12, color: "#888" }}>{plan.excluded.length} row{plan.excluded.length === 1 ? "" : "s"} skipped</summary>
              <div style={{ marginTop: 6, fontSize: 12, color: "#666" }}>
                {plan.excluded.slice(0, 10).map((r, i) => (
                  <div key={i} style={{ padding: "2px 0" }}>Row {r.row} ({r.raw || "empty"}): {r.reason}</div>
                ))}
                {plan.excluded.length > 10 && <div>and {plan.excluded.length - 10} more</div>}
              </div>
            </details>
          )}
        </div>
        <button onClick={send} disabled={!composed || sending || plan.valid.length === 0} style={{ width: "100%", cursor: composed && !sending ? "pointer" : "not-allowed", padding: "12px 24px", fontSize: 14, fontWeight: 600, background: composed && !sending ? "#1e88e5" : "#bbb", color: "#fff", border: "none", borderRadius: 4 }}>
          {sending ? "Sending " + plan.valid.length + " messages..." : "Send " + plan.valid.length.toLocaleString() + " message" + (plan.valid.length === 1 ? "" : "s")}
        </button>
      </StepShell>
    </section>
  );
}
