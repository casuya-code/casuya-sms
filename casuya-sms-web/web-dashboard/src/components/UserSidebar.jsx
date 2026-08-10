const NAV_ITEMS = [
  { key: "devices", label: "Devices", icon: "📱" },
  { key: "send", label: "Send SMS", icon: "💬" },
  { key: "templates", label: "Templates", icon: "📝" },
  { key: "logs", label: "SMS Logs", icon: "📋" },
  { key: "apikeys", label: "API Keys", icon: "🔑" },
];

export default function UserSidebar({ active, onSelect, user, onLogout, onAdmin, open, onClose }) {
  return (
    <>
      {open && (
        <div
          onClick={onClose}
          className="sidebar-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 40,
          }}
        />
      )}

      <aside
        className={`sidebar ${open ? "sidebar-open" : ""}`}
        style={{
          width: 240,
          minWidth: 240,
          background: "#1a2332",
          color: "#c9d1d9",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            padding: "20px 20px 16px",
            borderBottom: "1px solid #2d3748",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>casuya-sms</div>
          <div style={{ fontSize: 12, color: "#8892a0" }}>SMS Gateway</div>
        </div>

        <nav style={{ flex: 1, padding: "12px 0" }}>
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => { onSelect(item.key); onClose(); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  padding: "10px 20px",
                  border: "none",
                  background: isActive ? "#2563eb" : "transparent",
                  color: isActive ? "#fff" : "#c9d1d9",
                  fontSize: 14,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s",
                }}
              >
                <span style={{ fontSize: 16, width: 22, textAlign: "center" }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}

          {user?.role === "admin" && (
            <>
              <div style={{ height: 1, background: "#2d3748", margin: "12px 20px" }} />
              <button
                onClick={() => { onAdmin(); onClose(); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  padding: "10px 20px",
                  border: "none",
                  background: "transparent",
                  color: "#8892a0",
                  fontSize: 14,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: 16, width: 22, textAlign: "center" }}>⚙️</span>
                <span>Admin Panel</span>
              </button>
            </>
          )}
        </nav>

        <div style={{ padding: "16px 20px", borderTop: "1px solid #2d3748" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              {user?.email?.[0]?.toUpperCase() || "?"}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  color: "#fff",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user?.email}
              </div>
              {user?.role === "admin" && (
                <div style={{ fontSize: 11, color: "#2563eb", fontWeight: 600 }}>Admin</div>
              )}
            </div>
          </div>
          <button
            onClick={onLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #2d3748",
              borderRadius: 6,
              background: "transparent",
              color: "#8892a0",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>
    </>
  );
}
