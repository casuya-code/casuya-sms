import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, getUser } from "../lib/api";
import AdminSidebar from "../components/AdminSidebar";
import OverviewSection from "../components/admin/OverviewSection";
import UsersSection from "../components/admin/UsersSection";
import DevicesSection from "../components/admin/DevicesSection";
import LogsSection from "../components/admin/LogsSection";

const VALID_ADMIN_SECTIONS = ["overview", "users", "devices", "logs"];

export default function AdminPanel() {
  const navigate = useNavigate();
  const currentUser = getUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSection = searchParams.get("section");
  const [active, setActive] = useState(
    VALID_ADMIN_SECTIONS.includes(initialSection) ? initialSection : "overview"
  );

  const handleSectionChange = (section) => {
    setActive(section);
    setSearchParams({ section });
  };
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [s, u, d, l] = await Promise.allSettled([
        api.get("/api/admin/stats"),
        api.get("/api/admin/users"),
        api.get("/api/admin/devices"),
        api.get("/api/admin/logs"),
      ]);
      if (s.status === "fulfilled") setStats(s.value.data);
      if (u.status === "fulfilled") setUsers(u.value.data);
      if (d.status === "fulfilled") setDevices(d.value.data);
      if (l.status === "fulfilled") setLogs(l.value.data);
      const firstError = [s, u, d, l].find((r) => r.status === "rejected");
      if (firstError) {
        setError(
          firstError.reason?.response?.data?.error || "failed to load some admin data"
        );
      }
    } catch (e) {
      setError(e.response?.data?.error || "failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await load();
      if (cancelled) return;
    })();
    return () => { cancelled = true; };
  }, [load]);

  const toggleBan = async (userId, banned) => {
    try {
      await api.patch(`/api/admin/users/${userId}`, { banned: !banned });
      load();
    } catch (e) {
      setError(e.response?.data?.error || "failed to update user");
    }
  };

  const setRole = async (userId, role) => {
    try {
      await api.patch(`/api/admin/users/${userId}`, { role });
      load();
    } catch (e) {
      setError(e.response?.data?.error || "failed to change role");
    }
  };

  const deleteUser = async (userId, email) => {
    if (!confirm(`Permanently delete user "${email}"?`)) return;
    try {
      await api.delete(`/api/admin/users/${userId}`);
      load();
    } catch (e) {
      setError(e.response?.data?.error || "failed to delete user");
    }
  };

  const counts = {
    overview: undefined,
    users: users.length,
    devices: devices.length,
    logs: logs.length,
  };

  return (
    <div style={{ display: "flex", fontFamily: "system-ui, sans-serif" }}>
      <AdminSidebar
        active={active}
        onSelect={handleSectionChange}
        counts={counts}
        user={currentUser}
        onBack={() => navigate("/dashboard")}
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
            <div className="dash-header-title">
              {active === "overview" && "Dashboard Overview"}
              {active === "users" && "User Management"}
              {active === "devices" && "Device Management"}
              {active === "logs" && "SMS Logs"}
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            style={{
              padding: "8px 16px",
              fontSize: 13,
              cursor: "pointer",
              background: "#f5f5f5",
              border: "1px solid #ddd",
              borderRadius: 6,
              color: "#555",
            }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        <div className="main-content" style={{ maxWidth: 1200 }}>
          {error && (
            <div className="admin-error-banner">
              {error}
            </div>
          )}

          {loading && (
            <div className="admin-loading">
              Loading admin data...
            </div>
          )}

          {!loading && (
            <>
              {active === "overview" && (
                <OverviewSection
                  stats={stats}
                  users={users}
                  devices={devices}
                  logs={logs}
                />
              )}
              {active === "users" && (
                <UsersSection
                  users={users}
                  currentUser={currentUser}
                  onBan={toggleBan}
                  onDelete={deleteUser}
                  onRoleChange={setRole}
                />
              )}
              {active === "devices" && <DevicesSection devices={devices} />}
              {active === "logs" && <LogsSection logs={logs} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
