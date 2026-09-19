import { useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  ArrowLeftRight,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Package2,
  Menu,
  X,
  Shield,
  User,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === "ADMIN";

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/products", label: "Products", icon: Package },
    { to: "/sales", label: "Sales", icon: ShoppingBag },
    { to: "/stock-movements", label: "Stock Adjustments", icon: ArrowLeftRight },
    ...(isAdmin ? [{ to: "/reports", label: "Reports & Analytics", icon: BarChart3 }] : []),
    ...(isAdmin ? [{ to: "/users", label: "User Management", icon: Users }] : []),
  ];

  // Auto close mobile drawer on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setMobileOpen]);

  const handleLogout = () => {
    logout();
    toast.success("Signed out successfully.");
    navigate("/login");
  };

  const sidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full select-none">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-800/70 ${collapsed && !isMobile ? "justify-center" : ""}`}>
        <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
          <Package2 className="w-5 h-5 text-indigo-400" />
        </div>
        {(!collapsed || isMobile) && (
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="font-bold text-slate-100 text-sm tracking-tight leading-tight"
          >
            Inventory<br /><span className="text-indigo-400">Manager</span>
          </motion.span>
        )}
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto text-slate-500 hover:text-slate-300 transition cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto overflow-x-hidden">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => isMobile && setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                isActive
                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
              } ${collapsed && !isMobile ? "justify-center" : ""}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId={isMobile ? "mobile-active-pill" : "active-pill"}
                    className="absolute inset-0 bg-indigo-600/15 rounded-xl border border-indigo-500/25 pointer-events-none"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <Icon className={`w-4.5 h-4.5 shrink-0 relative z-10 ${isActive ? "text-indigo-400" : ""}`} />
                {(!collapsed || isMobile) && (
                  <span className="relative z-10 truncate">{label}</span>
                )}
                {/* Floating Tooltip for collapsed state */}
                {collapsed && !isMobile && (
                  <div className="fixed left-20 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-2xl">
                    {label}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Profile Widget */}
      <div className="border-t border-slate-800/70 p-3 space-y-2">
        <div className={`flex items-center gap-3 p-2 rounded-xl bg-slate-800/30 border border-slate-800/50 ${collapsed && !isMobile ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-slate-300" />
          </div>
          {(!collapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Shield className={`w-3 h-3 ${isAdmin ? "text-purple-400" : "text-emerald-400"}`} />
                <span className={`text-[11px] font-medium ${isAdmin ? "text-purple-400" : "text-emerald-400"}`}>{user?.role}</span>
              </div>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer group relative ${collapsed && !isMobile ? "justify-center" : ""}`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {(!collapsed || isMobile) && <span>Sign out</span>}
          {collapsed && !isMobile && (
            <div className="fixed left-20 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-red-300 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-2xl">
              Sign out
            </div>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────── */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
        className="hidden lg:flex flex-col h-full bg-slate-900/80 border-r border-slate-800/70 backdrop-blur-xl relative shrink-0 z-30"
      >
        {sidebarContent(false)}

        {/* Collapse toggle button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-5 -right-3.5 w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:border-indigo-500/50 transition-all cursor-pointer shadow-xl z-40"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </motion.aside>

      {/* ── Mobile Drawer ───────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.35 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-slate-900 border-r border-slate-800/70 z-50 lg:hidden shadow-2xl"
            >
              {sidebarContent(true)}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Mobile menu button — exported for use in Layout header
export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition cursor-pointer"
      aria-label="Open Navigation Menu"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}

