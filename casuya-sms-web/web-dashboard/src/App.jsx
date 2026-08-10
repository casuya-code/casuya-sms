import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import { api } from "./lib/api";

function RequireAuth({ children }) {
  const token = localStorage.getItem("casuya_token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const [authorized, setAuthorized] = useState(null);
  useEffect(() => {
    const token = localStorage.getItem("casuya_token");
    if (!token) {
      setAuthorized(false);
      return;
    }
    api
      .get("/api/auth/me")
      .then((res) => {
        const user = res.data.user;
        setAuthorized(user && user.role === "admin");
      })
      .catch(() => setAuthorized(false));
  }, []);
  if (authorized === null)
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#888" }}>
        Checking permissions...
      </div>
    );
  if (!authorized) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminPanel />
            </RequireAdmin>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
