import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, getUser, clearSession } from "../lib/api";
import UserSidebar from "../components/UserSidebar";
import DeviceList from "../components/DeviceList";
import SendSmsPanel from "../components/SendSmsPanel";
import UsageLog from "../components/UsageLog";
import ApiKeyManager from "../components/ApiKeyManager";
import TemplateList from "../components/TemplateList";

const VALID_SECTIONS = ["devices", "send", "templates", "logs", "apikeys"];
const PAGE_TITLES = {
  devices: "My Devices",
  send: "Send SMS",
  templates: "SMS Templates",
  logs: "SMS Logs",
  apikeys: "API Keys",
};

export default function Dashboard() {
  const [user, setUser] = useState(getUser());
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSection = searchParams.get("section");
  const [active, setActive] = useState(
    VALID_SECTIONS.includes(initialSection) ? initialSection : "devices"
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleSectionChange = (section) => {
    setActive(section);
    setSearchParams({ section });
  };

  useEffect(() => {
    let cancelled = false;
    api
      .get("/api/auth/me")
      .then((res) => {
        if (!cancelled) setUser(res.data.user);
      })
      .catch(() => {
        if (!cancelled) {
          clearSession();
          navigate("/login");
        }
      });
    return () => { cancelled = true; };
  }, [navigate]);

  const logout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", fontFamily: "system-ui, sans-serif" }}>
      <UserSidebar
        active={active}
        onSelect={handleSectionChange}
        user={user}
        onLogout={logout}
        onAdmin={() => navigate("/admin")}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div style={{ flex: 1, minHeight: "100vh", background: "#f5f5f5" }}>
        <header
          style={{
            background: "#fff",
            borderBottom: "1px solid #e0e0e0",
            padding: "12px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            zIndex: 30,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                display: "none",
                cursor: "pointer",
                padding: "6px",
                background: "none",
                border: "1px solid #ddd",
                borderRadius: 6,
                fontSize: 20,
                lineHeight: 1,
                color: "#333",
              }}
            >
              {sidebarOpen ? "✕" : "☰"}
            </button>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1a2332" }}>
              {PAGE_TITLES[active]}
            </div>
          </div>
        </header>

        <div style={{ padding: 16, maxWidth: 1000 }} className="main-content">
          {active === "devices" && <DeviceList />}
          {active === "send" && <SendSmsPanel />}
          {active === "templates" && <TemplateList />}
          {active === "logs" && <UsageLog />}
          {active === "apikeys" && <ApiKeyManager />}
        </div>
      </div>
    </div>
  );
}
