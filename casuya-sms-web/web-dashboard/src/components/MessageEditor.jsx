import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const VAR_RE = /\{[a-zA-Z_][a-zA-Z0-9_]*\}/g;

function parseParts(text) {
  if (!text) return [];
  const parts = [];
  let lastIndex = 0;
  let m;
  const re = new RegExp(VAR_RE.source, "g");
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIndex) {
      parts.push({ id: `t${m.index}`, type: "text", value: text.slice(lastIndex, m.index) });
    }
    parts.push({ id: `v${m.index}`, type: "var", value: m[0] });
    lastIndex = re.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push({ id: `t${lastIndex}`, type: "text", value: text.slice(lastIndex) });
  }
  return parts;
}

function partsToText(parts) {
  return parts.map((p) => p.value).join("");
}

function cloneParts(parts) {
  return parts.map((p) => ({ ...p }));
}

let _uid = 0;
function uid() { return `m${++_uid}${Date.now()}`; }

export default function MessageEditor({ value, onChange, placeholder }) {
  const parsedFromValue = useMemo(() => parseParts(value || ""), [value]);
  const [parts, setParts] = useState(parsedFromValue);
  const [history, setHistory] = useState([parsedFromValue]);
  const [pointer, setPointer] = useState(0);
  const [newText, setNewText] = useState("");
  const lastValueRef = useRef(value);

  useEffect(() => {
    if (value !== lastValueRef.current) {
      lastValueRef.current = value;
      const incoming = parseParts(value || "");
      setParts(incoming);
      setHistory([incoming]);
      setPointer(0);
    }
  }, [value]);

  const applyChange = useCallback((newParts, newHistory) => {
    setParts(newParts);
    setHistory(newHistory);
    setPointer(newHistory.length - 1);
    lastValueRef.current = partsToText(newParts);
    onChange(partsToText(newParts));
  }, [onChange]);

  const removePart = useCallback((id) => {
    const next = parts.filter((p) => p.id !== id);
    const final = next.length === 0 ? [{ id: uid(), type: "text", value: "" }] : next;
    const newHistory = [...history.slice(0, pointer + 1), cloneParts(final)];
    applyChange(final, newHistory);
  }, [parts, history, pointer, applyChange]);

  const applyAt = useCallback((targetPointer) => {
    setParts(cloneParts(history[targetPointer]));
    setPointer(targetPointer);
    lastValueRef.current = partsToText(history[targetPointer]);
    onChange(partsToText(history[targetPointer]));
  }, [history, onChange]);

  const undo = useCallback(() => {
    if (pointer <= 0) return;
    applyAt(pointer - 1);
  }, [pointer, applyAt]);

  const redo = useCallback(() => {
    if (pointer >= history.length - 1) return;
    applyAt(pointer + 1);
  }, [pointer, history.length, applyAt]);

  const addText = useCallback(() => {
    const t = newText.trim();
    if (!t) return;
    const final = [...parts, { id: uid(), type: "text", value: t }];
    const newHistory = [...history.slice(0, pointer + 1), cloneParts(final)];
    setNewText("");
    applyChange(final, newHistory);
  }, [newText, parts, history, pointer, applyChange]);

  const canUndo = pointer > 0;
  const canRedo = pointer < history.length - 1;
  const fullMessage = partsToText(parts);

  const chipBase = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "4px 8px",
    borderRadius: 4,
    fontSize: 13,
    whiteSpace: "nowrap",
  };

  const xBtn = {
    cursor: "pointer",
    background: "none",
    border: "none",
    color: "#999",
    fontSize: 15,
    fontWeight: 700,
    padding: "0 2px",
    lineHeight: 1,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        minHeight: 42,
        padding: 8,
        background: "#fff",
        border: "1px solid #ddd",
        borderRadius: 4,
        alignItems: "center",
      }}>
        {parts.length === 0 && (
          <span style={{ color: "#aaa", fontSize: 13 }}>{placeholder || "Type a message..."}</span>
        )}
        {parts.map((p) => {
          const isVar = p.type === "var";
          return (
            <span
              key={p.id}
              style={{
                ...chipBase,
                fontWeight: isVar ? 600 : 400,
                background: isVar ? "#e3f2fd" : "#f5f5f5",
                color: isVar ? "#1565c0" : "#333",
                border: `1px solid ${isVar ? "#bbdefb" : "#e0e0e0"}`,
              }}
            >
              {p.value}
              <span
                onClick={() => removePart(p.id)}
                style={xBtn}
                title="Remove"
                onMouseEnter={(e) => { e.currentTarget.style.color = "#d32f2f"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#999"; }}
              >
                ×
              </span>
            </span>
          );
        })}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", gap: 4 }}>
        <button onClick={undo} disabled={!canUndo} title="Undo" style={{
          cursor: canUndo ? "pointer" : "not-allowed",
          padding: "4px 8px", fontSize: 13,
          background: "#f5f5f5", border: "1px solid #ddd", borderRadius: 4,
          color: canUndo ? "#333" : "#bbb", fontWeight: 600,
        }}>↩</button>
        <button onClick={redo} disabled={!canRedo} title="Redo" style={{
          cursor: canRedo ? "pointer" : "not-allowed",
          padding: "4px 8px", fontSize: 13,
          background: "#f5f5f5", border: "1px solid #ddd", borderRadius: 4,
          color: canRedo ? "#333" : "#bbb", fontWeight: 600,
        }}>↪</button>
        </div>
        <div style={{ flex: 1, display: "flex", gap: 6, minWidth: 160 }}>
          <input
            type="text"
            placeholder="Add text..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addText(); } }}
            style={{ flex: 1, padding: "6px 10px", fontSize: 13, border: "1px solid #ddd", borderRadius: 4, outline: "none" }}
          />
          <button onClick={addText} disabled={!newText.trim()} style={{
            cursor: newText.trim() ? "pointer" : "not-allowed",
            padding: "6px 14px", fontSize: 13, fontWeight: 600,
            background: newText.trim() ? "#1e88e5" : "#bbb",
            color: "#fff", border: "none", borderRadius: 4,
          }}>Add</button>
        </div>
        <span style={{ fontSize: 12, color: "#999", whiteSpace: "nowrap" }}>{fullMessage.length}/1500</span>
      </div>
    </div>
  );
}
