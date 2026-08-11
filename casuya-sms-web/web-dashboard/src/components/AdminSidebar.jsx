const Icons = {
  Overview: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  Users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Devices: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
  Logs: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  Back: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  ),
};

const NAV_ITEMS = [
  { key: "overview", label: "Overview", icon: Icons.Overview },
  { key: "users", label: "Users", icon: Icons.Users },
  { key: "devices", label: "Devices", icon: Icons.Devices },
  { key: "logs", label: "SMS Logs", icon: Icons.Logs },
];

export default function AdminSidebar({ active, onSelect, counts, user, onBack, open, onClose }) {
  return (
    <>
      {open && <div onClick={onClose} className="sidebar-overlay" />}

      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="sidebar-header sidebar-header-admin">
          <div className="sidebar-brand">Casuya SMS</div>
          <div className="sidebar-sub">Admin Console</div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.key;
            const count = counts[item.key];
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => { onSelect(item.key); onClose(); }}
                className={`sidebar-item ${isActive ? "sidebar-item-active" : ""}`}
              >
                <span className="sidebar-icon"><Icon /></span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {count !== undefined && (
                  <span className={`sidebar-badge ${isActive ? "sidebar-badge-active" : ""}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar sidebar-avatar-admin">
              {user?.email?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-email">{user?.email}</div>
              <div className="sidebar-role">Administrator</div>
            </div>
          </div>
          <button onClick={onBack} className="sidebar-logout">
            <Icons.Back /> Back to Dashboard
          </button>
        </div>
      </aside>
    </>
  );
}
