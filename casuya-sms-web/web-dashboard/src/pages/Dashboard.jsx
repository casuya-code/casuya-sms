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
        <header className="dash-header">
          <div className="dash-header-left">
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? "\u2715" : "\u2630"}
            </button>
            <div className="dash-header-title">{PAGE_TITLES[active]}</div>
          </div>
        </header>

        <div className="main-content" style={{ maxWidth: 1000 }}>
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
