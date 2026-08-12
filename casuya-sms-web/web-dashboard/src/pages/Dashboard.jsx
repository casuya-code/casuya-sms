import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, getUser, clearSession } from "../lib/api";
import Sidebar, { Icons } from "../components/Sidebar";
import DeviceList from "../components/DeviceList";
import SendSmsPanel from "../components/SendSmsPanel";
import UsageLog from "../components/UsageLog";
import ApiKeyManager from "../components/ApiKeyManager";
import TemplateList from "../components/TemplateList";
import Messages from "../components/Messages";

const VALID_SECTIONS = ["devices", "send", "templates", "messages", "logs", "apikeys"];
const PAGE_TITLES = {
  devices: "My Devices",
  send: "Send SMS",
  templates: "SMS Templates",
  messages: "All Messages",
  logs: "SMS Logs",
  apikeys: "API Keys",
};

const USER_NAV_ITEMS = [
  { key: "devices", label: "Devices", icon: Icons.Devices },
  { key: "send", label: "Send SMS", icon: Icons.Send },
  { key: "templates", label: "Templates", icon: Icons.Templates },
  { key: "messages", label: "All Messages", icon: Icons.Messages },
  { key: "logs", label: "SMS Logs", icon: Icons.Logs },
  { key: "apikeys", label: "API Keys", icon: Icons.ApiKeys },
];

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

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const logout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", fontFamily: "system-ui, sans-serif" }}>
      <Sidebar
        active={active}
        onSelect={handleSectionChange}
        user={user}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        ariaLabel="User navigation"
        sidebarId="dashboard-sidebar"
        headerSub="SMS Gateway"
        roleLabel={user?.role === "admin" ? "Admin" : undefined}
        navItems={USER_NAV_ITEMS}
        extraNav={
          user?.role === "admin" ? (
            <>
              <div className="sidebar-divider" />
              <button
                onClick={() => { navigate("/admin"); setSidebarOpen(false); }}
                className="sidebar-item sidebar-item-admin"
              >
                <span className="sidebar-icon"><Icons.Admin /></span>
                <span>Admin Panel</span>
              </button>
            </>
          ) : null
        }
        footer={
          <button onClick={logout} className="sidebar-logout">
            <Icons.Logout /> Sign Out
          </button>
        }
      />

      <div style={{ flex: 1, minHeight: "100vh", background: "#f5f5f5" }}>
        <header className="dash-header">
          <div className="dash-header-left">
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation"
              aria-expanded={sidebarOpen}
              aria-controls="dashboard-sidebar"
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
          {active === "messages" && <Messages />}
          {active === "logs" && <UsageLog />}
          {active === "apikeys" && <ApiKeyManager />}
        </div>
      </div>
    </div>
  );
}
