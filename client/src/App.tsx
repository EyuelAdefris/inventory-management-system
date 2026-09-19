import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import Sales from "@/pages/Sales";
import StockMovements from "@/pages/StockMovements";
import Reports from "@/pages/Reports";
import Users from "@/pages/Users";

// ── Loading Spinner ───────────────────────────────────────────────────────────
function FullPageSpinner() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ── Protected Route ───────────────────────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <FullPageSpinner />;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

// ── Admin-Only Route Guard ────────────────────────────────────────────────────
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== "ADMIN") {
    return <Navigate to="/sales" replace />;
  }
  return <>{children}</>;
}

// ── Default Redirect (role-aware) ─────────────────────────────────────────────
function DefaultRedirect() {
  const { user } = useAuth();
  return <Navigate to={user?.role === "ADMIN" ? "/dashboard" : "/sales"} replace />;
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected — all wrapped in Layout */}
        <Route
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/sales" element={<Sales />} />
                  <Route path="/stock-movements" element={<StockMovements />} />
                  <Route path="/reports" element={<AdminRoute><Reports /></AdminRoute>} />
                  <Route path="/users" element={<AdminRoute><Users /></AdminRoute>} />
                  <Route path="*" element={<DefaultRedirect />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
          path="/*"
        />

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
