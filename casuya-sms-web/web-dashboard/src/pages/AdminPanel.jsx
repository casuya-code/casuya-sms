import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, getUser } from "../lib/api";
import Sidebar, { Icons } from "../components/Sidebar";
import OverviewSection from "../components/admin/OverviewSection";
import UsersSection from "../components/admin/UsersSection";
import DevicesSection from "../components/admin/DevicesSection";
import LogsSection from "../components/admin/LogsSection";

const VALID_ADMIN_SECTIONS = ["overview", "users", "devices", "logs"];
const PAGE_SIZE = 50;

const ADMIN_NAV_ITEMS = [
  { key: "overview", label: "Overview", icon: Icons.Overview },
  { key: "users", label: "Users", icon: Icons.Users },
  { key: "devices", label: "Devices", icon: Icons.Devices },
  { key: "logs", label: "SMS Logs", icon: Icons.Logs },
];

const SECTION_ENDPOINTS = {
  users: "/api/admin/users",
  devices: "/api/admin/devices",
  logs: "/api/admin/logs",
};

export default function AdminPanel() {
  const navigate = useNavigate();
  const currentUser = getUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSection = searchParams.get("section");
  const [active, setActive] = useState(
    VALID_ADMIN_SECTIONS.includes(initialSection) ? initialSection : "overview"
  );
  const [page, setPage] = useState({ users: 1, devices: 1, logs: 1 });
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [devices, setDevices] = useState([]);
  const [devicesTotal, setDevicesTotal] = useState(0);
  const [logs, setLogs] = useState([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const mountedRef = useRef(true);
  const pageRef = useRef(page);
  useEffect(() => {
    pageRef.current = page;
  }, [page]);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const handleSectionChange = (section) => {
    setActive(section);
    setSearchParams({ section });
  };

  const fetchSection = useCallback(async (name, pageNum) => {
    const res = await api.get(SECTION_ENDPOINTS[name], {
      params: { page: pageNum, limit: PAGE_SIZE },
    });
    return { rows: res.data.data || [], total: res.data.total || 0 };
  }, []);

  const load = useCallback(async ({ silent = false, pages } = {}) => {
    const p = pages || pageRef.current;
    if (!silent) setLoading(true);
    setError("");
    try {
      const [s, u, d, l] = await Promise.allSettled([
        api.get("/api/admin/stats"),
        fetchSection("users", p.users),
        fetchSection("devices", p.devices),
        fetchSection("logs", p.logs),
      ]);
      if (!mountedRef.current) return;
      if (s.status === "fulfilled") setStats(s.value.data);
      if (u.status === "fulfilled") {
        setUsers(u.value.rows);
        setUsersTotal(u.value.total);
      }
      if (d.status === "fulfilled") {
        setDevices(d.value.rows);
        setDevicesTotal(d.value.total);
      }
      if (l.status === "fulfilled") {
        setLogs(l.value.rows);
        setLogsTotal(l.value.total);
      }
      const firstError = [s, u, d, l].find((r) => r.status === "rejected");
      if (firstError) {
        setError(firstError.reason?.response?.data?.error || "failed to load some admin data");
      }
    } catch (e) {
      if (mountedRef.current && e?.name !== "CanceledError") {
        setError(e.response?.data?.error || "failed to load admin data");
      }
    } finally {
      if (!silent && mountedRef.current) setLoading(false);
    }
  }, [fetchSection]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const changePage = useCallback(async (name, newPage) => {
    setPage((p) => ({ ...p, [name]: newPage }));
    setError("");
    try {
      const res = await fetchSection(name, newPage);
      if (!mountedRef.current) return;
      if (name === "users") {
        setUsers(res.rows);
        setUsersTotal(res.total);
      } else if (name === "devices") {
        setDevices(res.rows);
        setDevicesTotal(res.total);
      } else {
        setLogs(res.rows);
        setLogsTotal(res.total);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e.response?.data?.error || `failed to load ${name}`);
      }
    }
  }, [fetchSection]);

  const toggleBan = async (userId, banned) => {
    try {
      await api.patch(`/api/admin/users/${userId}`, { banned: !banned });
      load({ silent: true });
    } catch (e) {
      setError(e.response?.data?.error || "failed to update user");
    }
  };

  const setRole = async (userId, role) => {
    try {
      await api.patch(`/api/admin/users/${userId}`, { role });
      load({ silent: true });
    } catch (e) {
      setError(e.response?.data?.error || "failed to change role");
    }
  };

  const deleteUser = async (userId, email) => {
    if (!confirm(`Permanently delete user "${email}"?`)) return;
    try {
      await api.delete(`/api/admin/users/${userId}`);
      const goBack = users.length === 1 && page.users > 1;
      const nextPage = goBack ? page.users - 1 : page.users;
      if (goBack) setPage((pg) => ({ ...pg, users: nextPage }));
      load({ silent: true, pages: { ...page, users: nextPage } });
    } catch (e) {
      setError(e.response?.data?.error || "failed to delete user");
    }
  };

  const counts = {
    overview: undefined,
    users: usersTotal,
    devices: devicesTotal,
    logs: logsTotal,
  };

  const navItems = ADMIN_NAV_ITEMS.map((item) => ({
    ...item,
    count: counts[item.key],
  }));

  return (
    <div style={{ display: "flex", fontFamily: "system-ui, sans-serif" }}>
      <Sidebar
        active={active}
        onSelect={handleSectionChange}
        user={currentUser}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        ariaLabel="Admin navigation"
        sidebarId="admin-sidebar"
        headerSub="Admin Console"
        headerClass="sidebar-header-admin"
        avatarClass="sidebar-avatar-admin"
        roleLabel="Administrator"
        navItems={navItems}
        footer={
          <button onClick={() => navigate("/dashboard")} className="sidebar-logout">
            <Icons.Back /> Back to Dashboard
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
              aria-controls="admin-sidebar"
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
            onClick={() => load()}
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
                  total={usersTotal}
                  page={page.users}
                  pageSize={PAGE_SIZE}
                  onPage={(p) => changePage("users", p)}
                  currentUser={currentUser}
                  onBan={toggleBan}
                  onDelete={deleteUser}
                  onRoleChange={setRole}
                />
              )}
              {active === "devices" && (
                <DevicesSection
                  devices={devices}
                  total={devicesTotal}
                  page={page.devices}
                  pageSize={PAGE_SIZE}
                  onPage={(p) => changePage("devices", p)}
                />
              )}
              {active === "logs" && (
                <LogsSection
                  logs={logs}
                  total={logsTotal}
                  page={page.logs}
                  pageSize={PAGE_SIZE}
                  onPage={(p) => changePage("logs", p)}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
