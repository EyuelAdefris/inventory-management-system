import { useState, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Sidebar, { MobileMenuButton } from "./Sidebar";
import NotificationBell from "./NotificationBell";
import { useAuth } from "@/context/AuthContext";

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/products": "Products",
  "/sales": "Sales",
  "/stock-movements": "Stock Adjustments",
  "/reports": "Reports & Analytics",
};

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const pageTitle = breadcrumbMap[location.pathname] ?? "Dashboard";

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="relative z-40 flex items-center gap-4 px-4 sm:px-6 py-3.5 border-b border-slate-800/70 bg-slate-900 backdrop-blur-xl shrink-0">
          <MobileMenuButton onClick={() => setMobileOpen(true)} />

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Inventory</span>
            <span className="text-slate-700">/</span>
            <span className="text-slate-200 font-semibold">{pageTitle}</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Notification bell */}
            <NotificationBell />

            {/* User chip */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="w-5 h-5 rounded-full bg-indigo-600/30 flex items-center justify-center">
                <span className="text-[10px] font-bold text-indigo-300">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-slate-300 font-medium">{user?.name}</span>
              <span className="text-[11px] text-indigo-400 font-medium px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                {user?.role}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
