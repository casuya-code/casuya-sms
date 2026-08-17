function safeDate(value) {
  if (value === undefined || value === null || value === "") return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d;
}

export function formatDateTime(value) {
  const d = safeDate(value);
  if (!d) return "";
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(value) {
  const d = safeDate(value);
  if (!d) return "";
  return d.toLocaleDateString();
}

export function formatTime(value) {
  const d = safeDate(value);
  if (!d) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}