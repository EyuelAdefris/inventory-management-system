import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  ShoppingBag,
  PackagePlus,
  PackageCheck,
  PackageX,
  AlertTriangle,
  CheckCheck,
  Clock,
} from "lucide-react";
import api from "@/lib/api";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "SALE" | "PRODUCT_ADD" | "PRODUCT_UPDATE" | "PRODUCT_DELETE" | "STOCK_LOW";
  isRead: boolean;
  createdAt: string;
}

function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getNotificationBadge(type: NotificationItem["type"]) {
  switch (type) {
    case "SALE":
      return {
        icon: ShoppingBag,
        color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      };
    case "PRODUCT_ADD":
      return {
        icon: PackagePlus,
        color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      };
    case "PRODUCT_UPDATE":
      return {
        icon: PackageCheck,
        color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      };
    case "PRODUCT_DELETE":
      return {
        icon: PackageX,
        color: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      };
    case "STOCK_LOW":
      return {
        icon: AlertTriangle,
        color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      };
    default:
      return {
        icon: Bell,
        color: "bg-slate-800 text-slate-400 border-slate-700",
      };
  }
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications ?? []);
      setUnreadCount(res.data.unreadCount ?? 0);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Periodic polling every 30 seconds for real-time updates
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleOpen = async () => {
    const willOpen = !isOpen;
    setIsOpen(willOpen);

    if (willOpen && unreadCount > 0) {
      try {
        await api.patch("/notifications/mark-as-read");
        setUnreadCount(0);
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true }))
        );
      } catch (err) {
        console.error("Failed to mark notifications as read:", err);
      }
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggleOpen}
        className="relative p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer focus:outline-none"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-lg shadow-rose-500/30 animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Solid Opaque Notifications Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 z-[100] overflow-hidden"
          >
            {/* Header - 100% Opaque Solid bg-slate-950 */}
            <div className="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-slate-100">Activity & Notifications</h3>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 ? (
                  <span className="text-[11px] font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                    <CheckCheck className="w-3 h-3 text-emerald-400" /> All read
                  </span>
                )}
              </div>
            </div>

            {/* Notification List - 100% Opaque Solid bg-slate-900 */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-800 bg-slate-900">
              {loading && notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">Loading activities…</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 space-y-1">
                  <p className="font-medium text-slate-400">No activity logs yet</p>
                  <p>System activities like sales and product changes will appear here.</p>
                </div>
              ) : (
                notifications.map((item) => {
                  const badge = getNotificationBadge(item.type);
                  const IconComponent = badge.icon;

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 flex items-start gap-3 transition hover:bg-slate-800/80 ${
                        !item.isRead ? "bg-slate-800/50" : "bg-slate-900"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${badge.color}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-200 truncate">{item.title}</p>
                          <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {formatRelativeTime(item.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5 break-words line-clamp-2">{item.message}</p>
                      </div>

                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
