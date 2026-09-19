import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Package,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  ArrowRight,
  ShoppingBag,
  ArrowLeftRight,
  BarChart3,
  Calendar,
  ChevronDown,
  X,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface DashboardSummary {
  totalActiveProducts: number;
  lowStockCount: number;
  totalInventoryValue: number;
  totalRevenue: number;
  totalStockUnits?: number;
}

interface TopProduct {
  product?: { name?: string; sku?: string; isActive?: boolean } | null;
  totalQuantitySold: number;
  totalRevenue: number;
}

interface SalesTrend {
  date: string;
  revenue: number;
}

interface RecentTransactionItem {
  id?: string;
  quantity: number;
  unitPrice: number;
  product?: {
    name?: string;
    sku?: string;
  } | null;
}

interface RecentTransaction {
  id: string;
  createdAt: string;
  totalAmount: number;
  user?: {
    id?: string;
    name?: string;
    username?: string;
    email?: string | null;
    role?: string;
  } | null;
  items?: RecentTransactionItem[];
  saleItems?: RecentTransactionItem[];
}

const formatDate = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const getFilterDates = (filter: string) => {
  const now = new Date();
  if (filter === "this_week") {
    const day = now.getDay();
    const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.getFullYear(), now.getMonth(), diffToMonday);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
    return { start: formatDate(monday), end: formatDate(sunday) };
  }
  if (filter === "monthly") {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start: formatDate(firstDay), end: formatDate(lastDay) };
  }
  return { start: "", end: "" }; // "all"
};

function KPICard({
  label, value, sub, icon: Icon, color, warn = false, onClick,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: any;
  color: string;
  warn?: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      onClick={onClick}
      className={`p-6 rounded-2xl bg-slate-900/60 border backdrop-blur cursor-default transition-shadow hover:shadow-xl ${
        warn ? "border-amber-500/30 shadow-amber-500/5" : "border-slate-800/70"
      } ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {warn && (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Action needed
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-slate-100">{value}</p>
        <p className="text-sm text-slate-500 mt-1">{label}</p>
        {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

function QuickLinkCard({ label, description, icon: Icon, to, color }: { label: string; description: string; icon: any; to: string; color: string }) {
  const navigate = useNavigate();
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(to)}
      className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 hover:border-slate-700/80 hover:bg-slate-800/40 transition text-left flex items-center gap-4 cursor-pointer w-full"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-200 text-sm">{label}</p>
        <p className="text-xs text-slate-500 truncate">{description}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
    </motion.button>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [filterOption, setFilterOption] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState("");
  const [tempEndDate, setTempEndDate] = useState("");

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [topSellingProducts, setTopSellingProducts] = useState<TopProduct[]>([]);
  const [salesTrend, setSalesTrend] = useState<SalesTrend[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(true);

  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [recentTransactionsLoading, setRecentTransactionsLoading] = useState(true);

  // Fetch KPI cards summary on initial mount
  const fetchDashboardStats = async () => {
    setSummaryLoading(true);
    try {
      const response = await api.get("/reports/dashboard-summary");
      console.log("Dashboard Stats Response:", response.data);
      setSummary(response.data);
      setTotalRevenue(response.data.totalRevenue || 0);
    } catch (err) {
      console.error("Failed to load dashboard summary:", err);
      toast.error("Failed to load dashboard summary.");
    } finally {
      setSummaryLoading(false);
    }
  };

  // Fetch recent sales transactions (5 latest)
  const fetchRecentTransactions = async () => {
    setRecentTransactionsLoading(true);
    try {
      const response = await api.get("/sales", { params: { limit: 5 } });
      console.log("Recent Transactions Data:", response.data);
      const data = Array.isArray(response.data) ? response.data : [];
      setRecentTransactions(data.slice(0, 5));
    } catch (err) {
      console.error("Failed to load recent transactions:", err);
    } finally {
      setRecentTransactionsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchRecentTransactions();
  }, []);

  // Fetch sales summary (graph & top products) whenever startDate or endDate changes
  useEffect(() => {
    const fetchSalesData = async () => {
      setSalesLoading(true);
      try {
        const params: Record<string, string> = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        const sRes = await api.get("/reports/sales-summary", { params });
        console.log("Sales Summary Response:", sRes.data);
        setTopSellingProducts(sRes.data.topSellingProducts ?? sRes.data.topProducts ?? []);
        setSalesTrend(sRes.data.salesTrend ?? []);
      } catch {
        toast.error("Failed to load sales summary data.");
      } finally {
        setSalesLoading(false);
      }
    };
    fetchSalesData();
  }, [startDate, endDate]);

  const handleFilterOptionChange = (option: string) => {
    if (option === "custom") {
      setTempStartDate(startDate);
      setTempEndDate(endDate);
      setIsCustomModalOpen(true);
    } else {
      setFilterOption(option);
      const { start, end } = getFilterDates(option);
      setStartDate(start);
      setEndDate(end);
    }
  };

  const handleApplyCustomDate = () => {
    if (tempStartDate && tempEndDate && tempStartDate > tempEndDate) {
      toast.error("Start date cannot be after end date.");
      return;
    }
    setFilterOption("custom");
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setIsCustomModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Page Heading */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Your inventory at a glance</p>
      </div>

      {/* KPI Cards */}
      {summaryLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-36 rounded-2xl bg-slate-900/40 border border-slate-800/50 animate-pulse" />
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KPICard
            label="Total Items in Stock"
            value={(summary.totalStockUnits ?? 0).toLocaleString()}
            sub={`${summary.totalActiveProducts} active products`}
            icon={Package}
            color="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
            onClick={() => navigate("/products")}
          />
          <KPICard
            label="Low Stock Items"
            value={String(summary.lowStockCount)}
            sub={summary.lowStockCount > 0 ? "Requires restocking" : "All items are healthy"}
            icon={AlertTriangle}
            color={summary.lowStockCount > 0 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-slate-800 text-slate-500"}
            warn={summary.lowStockCount > 0}
            onClick={() => navigate("/reports")}
          />
          <KPICard
            label="Inventory Value"
            value={`$${Number(summary.totalInventoryValue).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            sub={`${(summary.totalStockUnits ?? 0).toLocaleString()} units in stock`}
            icon={DollarSign}
            color="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          />
          <KPICard
            label="Total Revenue"
            value={`$${Number(totalRevenue || summary.totalRevenue || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={TrendingUp}
            color="bg-purple-500/10 text-purple-400 border border-purple-500/20"
            onClick={() => navigate("/reports")}
          />
        </div>
      ) : null}

      {/* ── ADMIN VIEW ─────────────────────────────────────────────────────── */}
      {isAdmin ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="xl:col-span-2 space-y-6">
          {/* Revenue Trend Chart */}
          <div className="bg-slate-900/60 border border-slate-800/70 rounded-2xl overflow-hidden p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="font-semibold text-slate-200 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                Sales & Revenue Trend
              </h2>

              {/* Date Filter Dropdown */}
              <div className="relative flex items-center gap-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-indigo-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <select
                    value={filterOption}
                    onChange={(e) => handleFilterOptionChange(e.target.value)}
                    className="pl-9 pr-8 py-1.5 text-xs font-medium bg-slate-950/80 border border-slate-800 hover:border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition appearance-none cursor-pointer [color-scheme:dark]"
                  >
                    <option value="all">All Time</option>
                    <option value="this_week">Current Week</option>
                    <option value="monthly">Current Month</option>
                    <option value="custom">
                      {filterOption === "custom" && startDate && endDate
                        ? `Custom (${startDate} to ${endDate})`
                        : "Custom Range…"}
                    </option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              {salesLoading ? (
                <div className="w-full h-full bg-slate-800/30 animate-pulse rounded-xl flex items-center justify-center text-slate-500 text-xs">
                  Loading sales data…
                </div>
              ) : salesTrend.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">No sales data available for selected period.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "12px", color: "#f8fafc" }}
                      itemStyle={{ color: "#818cf8", fontWeight: "bold" }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top Selling Products */}
          <div className="bg-slate-900/60 border border-slate-800/70 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800/70 flex items-center justify-between">
              <h2 className="font-semibold text-slate-200 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Top Selling Products
              </h2>
              <button
                onClick={() => navigate("/reports")}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition cursor-pointer"
              >
                View full report <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800/50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Units Sold</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {salesLoading ? (
                    <tr><td colSpan={4} className="text-center py-12 text-slate-600">Loading…</td></tr>
                  ) : topSellingProducts?.length > 0 ? (
                    topSellingProducts.map((item, i) => (
                      <motion.tr
                        key={(item.product?.name ?? "") + i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.06 }}
                        className="border-b border-slate-800/40 hover:bg-slate-800/20 transition"
                      >
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              i === 0 ? "bg-amber-500/20 text-amber-300" :
                              i === 1 ? "bg-slate-400/20 text-slate-300" :
                              i === 2 ? "bg-orange-700/20 text-orange-400" :
                              "bg-slate-800 text-slate-600"
                            }`}>{i + 1}</span>
                            <span className="font-medium text-slate-200">{item.product?.name || 'Deleted Product'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs font-mono text-slate-500">{item.product?.sku || 'N/A'}</td>
                        <td className="px-4 py-3.5 text-right font-semibold text-indigo-400">{item.totalQuantitySold}</td>
                        <td className="px-6 py-3.5 text-right font-semibold text-emerald-400">${item.totalRevenue}</td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className="text-center py-12 text-slate-600">No sales data yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-3">
          <h2 className="font-semibold text-slate-300 text-sm px-1">Quick Navigation</h2>
          <QuickLinkCard
            label="Products"
            description="Manage catalog, pricing & inventory"
            icon={Package}
            to="/products"
            color="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
          />
          <QuickLinkCard
            label="Sales"
            description="Process transactions & view history"
            icon={ShoppingBag}
            to="/sales"
            color="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          />
          <QuickLinkCard
            label="Stock Adjustments"
            description="Manual corrections & audit log"
            icon={ArrowLeftRight}
            to="/stock-movements"
            color="bg-purple-500/10 text-purple-400 border border-purple-500/20"
          />
          <QuickLinkCard
            label="Reports & Analytics"
            description="Financial & inventory insights"
            icon={BarChart3}
            to="/reports"
            color="bg-amber-500/10 text-amber-400 border border-amber-500/20"
          />
        </div>
      </div>
      ) : (
        /* ── STAFF VIEW ──────────────────────────────────────────────────── */
        <div className="space-y-6">
          {/* Staff Quick Navigation */}
          <div className="space-y-3">
            <h2 className="font-semibold text-slate-300 text-sm px-1">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <QuickLinkCard
                label="Products"
                description="View catalog & perform quick sales"
                icon={Package}
                to="/products"
                color="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
              />
              <QuickLinkCard
                label="Sales"
                description="Process transactions & view history"
                icon={ShoppingBag}
                to="/sales"
                color="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              />
              <QuickLinkCard
                label="Stock Adjustments"
                description="View inventory movement audit log"
                icon={ArrowLeftRight}
                to="/stock-movements"
                color="bg-purple-500/10 text-purple-400 border border-purple-500/20"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Recent Transactions (Visible to both ADMIN and STAFF) ─────────── */}
      <div className="bg-slate-900/60 border border-slate-800/70 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-200 text-sm">Recent Transactions</h2>
              <p className="text-xs text-slate-500">Latest sales activity across all staff</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/sales")}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition cursor-pointer group"
          >
            <span>View All Sales</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/60 bg-slate-950/30">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Transaction ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Items Sold</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Amount</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Processed By</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactionsLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading recent transactions…</span>
                    </div>
                  </td>
                </tr>
              ) : recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                      <ShoppingBag className="w-8 h-8 text-slate-700" />
                      <p className="text-sm font-medium">No recent transactions found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                recentTransactions.map((sale, i) => {
                  const itemsList = sale.items || sale.saleItems || [];
                  const itemsText =
                    itemsList.length > 0
                      ? itemsList
                          .map((it) => `${it.product?.name || "Item"} (x${it.quantity})`)
                          .join(", ")
                      : "—";
                  const processedBy = sale.user?.name || sale.user?.username || "Staff";
                  const shortId = `#${sale.id ? (sale.id.length > 6 ? sale.id.slice(-6) : sale.id).toUpperCase() : "—"}`;
                  const formattedDate = sale.createdAt ? new Date(sale.createdAt).toLocaleString() : "—";
                  const totalFormatted = `$${Number(sale.totalAmount || 0).toFixed(2)}`;

                  return (
                    <motion.tr
                      key={sale.id || i}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-slate-800/40 hover:bg-slate-800/30 transition"
                    >
                      <td className="px-6 py-3.5">
                        <span className="font-mono text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                          {shortId}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-300 max-w-xs truncate" title={itemsText}>
                        {itemsText}
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-emerald-400">
                        {totalFormatted}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                          {processedBy}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right text-xs text-slate-400 whitespace-nowrap font-mono">
                        {formattedDate}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Date Range Modal */}
      <AnimatePresence>
        {isCustomModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-100">Custom Date Range</h3>
                    <p className="text-xs text-slate-400">Select start and end dates for sales data</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyCustomDate}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 transition cursor-pointer"
                >
                  Apply Filter
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
