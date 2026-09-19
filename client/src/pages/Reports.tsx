import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Calendar,
  Trophy,
  Layers,
  Boxes,
  Percent,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface LowStockItem {
  id: string;
  name: string;
  sku: string;
  stockQuantity: number;
  minStockLevel: number;
  category?: { name: string };
  supplier?: { name: string };
}

interface TopProduct {
  productId: string;
  productName: string;
  sku: string;
  totalQuantitySold: number;
  totalRevenue: number;
}

interface SalesSummary {
  totalRevenue: number;
  totalSalesCount: number;
  averageOrderValue?: number;
  topProducts?: TopProduct[];
  topSellingProducts?: Array<{
    product?: { id: string; name: string; sku: string };
    totalQuantitySold: number;
    totalRevenue: number;
  }>;
}

interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  unitsSold: number;
  revenue: number;
  cost: number;
  grossProfit: number;
  profitMargin: number;
}

interface ProductBreakdown {
  productId: string;
  productName: string;
  categoryName: string;
  unitsSold: number;
  revenue: number;
  cost: number;
  grossProfit: number;
  profitMargin: number;
}

interface FinancialSummaryData {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
  inventoryValuation: number;
  potentialRevenue: number;
  totalStockUnits?: number;
  categoryBreakdown?: CategoryBreakdown[];
  productBreakdown?: ProductBreakdown[];
}

type Tab = "financial" | "sales" | "low-stock";

function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  subtitle?: string;
  icon: any;
  color: string;
}) {
  return (
    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/70 flex items-center justify-between gap-4 shadow-sm hover:border-slate-700/80 transition-all">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-slate-100 mt-0.5">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState<Tab>("financial");
  const [breakdownView, setBreakdownView] = useState<"category" | "product">("category");
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [financialData, setFinancialData] = useState<FinancialSummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchLowStock = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/reports/low-stock");
      setLowStock(res.data || []);
    } catch {
      toast.error("Failed to load low stock report.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSalesSummary = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.get("/reports/sales-summary", { params });
      setSalesSummary(res.data);
    } catch {
      toast.error("Failed to load sales summary.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  const fetchFinancialSummary = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.get("/reports/financial-summary", { params });
      setFinancialData(res.data);
    } catch {
      toast.error("Failed to load financial summary.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (activeTab === "financial") {
      fetchFinancialSummary();
    } else if (activeTab === "low-stock") {
      fetchLowStock();
    } else if (activeTab === "sales") {
      fetchSalesSummary();
    }
  }, [activeTab, fetchFinancialSummary, fetchLowStock, fetchSalesSummary]);

  const handleRefresh = () => {
    if (activeTab === "financial") fetchFinancialSummary();
    else if (activeTab === "low-stock") fetchLowStock();
    else if (activeTab === "sales") fetchSalesSummary();
  };

  const criticalCount = lowStock.filter((i) => i.stockQuantity === 0).length;

  const formatCurrency = (val: number | undefined | null) => {
    const num = Number(val ?? 0);
    return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Reports & Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">
            Inventory valuation, profit metrics, and financial performance insights
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl border border-slate-700 transition cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1 bg-slate-900/60 border border-slate-800/70 rounded-2xl w-full sm:w-fit">
        {[
          { id: "financial" as Tab, label: "Financial Summary", icon: DollarSign },
          { id: "sales" as Tab, label: "Sales Overview", icon: ShoppingCart },
          { id: "low-stock" as Tab, label: "Low-Stock Alerts", icon: AlertTriangle },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${activeTab === id
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
              : "text-slate-500 hover:text-slate-300"
              }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── FINANCIAL SUMMARY TAB ────────────────────────────────────────── */}
      {activeTab === "financial" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Date Range Filter */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:items-end bg-slate-900/40 border border-slate-800/60 p-4 rounded-2xl">
            <div className="space-y-1.5 flex-1 sm:flex-initial">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
              />
            </div>
            <div className="space-y-1.5 flex-1 sm:flex-initial">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchFinancialSummary}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition cursor-pointer"
              >
                Apply Filter
              </button>
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 text-sm transition cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {loading && !financialData ? (
            <div className="text-center py-20 text-slate-500">Loading financial summary…</div>
          ) : (
            <>
              {/* 5 Core KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <StatCard
                  label="Total Revenue"
                  value={formatCurrency(financialData?.totalRevenue ?? 0)}
                  icon={DollarSign}
                  color="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                />
                <StatCard
                  label="Total Cost"
                  value={formatCurrency(financialData?.totalCost ?? 0)}
                  icon={ShoppingCart}
                  color="bg-slate-500/10 text-slate-400 border border-slate-500/20"
                />
                <StatCard
                  label="Net Profit"
                  value={formatCurrency(financialData?.grossProfit ?? 0)}
                  icon={(financialData?.grossProfit ?? 0) >= 0 ? TrendingUp : TrendingDown}
                  color={
                    (financialData?.grossProfit ?? 0) >= 0
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }
                />
                <StatCard
                  label="Net Profit Margin"
                  value={`${Number(financialData?.profitMargin ?? 0).toFixed(2)}%`}
                  icon={Percent}
                  color={
                    (financialData?.profitMargin ?? 0) >= 0
                      ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }
                />
                <StatCard
                  label="Inventory Valuation"
                  value={formatCurrency(financialData?.inventoryValuation ?? 0)}
                  subtitle={`${(financialData?.totalStockUnits ?? 0).toLocaleString()} units · Potential: ${formatCurrency(financialData?.potentialRevenue ?? 0)}`}
                  icon={Boxes}
                  color="bg-amber-500/10 text-amber-400 border border-amber-500/20"
                />
              </div>

              {/* Financial Breakdown Table / Analytics */}
              <div className="bg-slate-900/60 border border-slate-800/70 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-slate-200 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      Sales Financial Breakdown
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Revenue, cost, and estimated margin performance
                    </p>
                  </div>

                  {/* Toggle Category vs Product view */}
                  <div className="inline-flex p-1 bg-slate-950/60 border border-slate-800 rounded-xl">
                    <button
                      onClick={() => setBreakdownView("category")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${breakdownView === "category"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                        }`}
                    >
                      By Category
                    </button>
                    <button
                      onClick={() => setBreakdownView("product")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${breakdownView === "product"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                        }`}
                    >
                      By Product
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800/70 bg-slate-950/20">
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          {breakdownView === "category" ? "Category" : "Product"}
                        </th>
                        <th className="text-right px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Units Sold
                        </th>
                        <th className="text-right px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Revenue Generated
                        </th>
                        <th className="text-right px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Total Cost
                        </th>
                        <th className="text-right px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Net Profit
                        </th>
                        <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Profit Margin %
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {breakdownView === "category" ? (
                        (financialData?.categoryBreakdown ?? []).length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-14 text-slate-500">
                              No financial sales data found for this period.
                            </td>
                          </tr>
                        ) : (
                          (financialData?.categoryBreakdown ?? []).map((cat, idx) => {
                            const isPositive = (cat.grossProfit ?? 0) >= 0;
                            return (
                              <motion.tr
                                key={cat.categoryId || idx}
                                initial={{ opacity: 0, y: 3 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className="hover:bg-slate-800/30 transition-colors"
                              >
                                <td className="px-5 py-3.5 font-medium text-slate-200">
                                  {cat.categoryName || "Uncategorized"}
                                </td>
                                <td className="px-4 py-3.5 text-right font-mono text-slate-300">
                                  {cat.unitsSold ?? 0}
                                </td>
                                <td className="px-4 py-3.5 text-right font-semibold text-emerald-400">
                                  {formatCurrency(cat.revenue ?? 0)}
                                </td>
                                <td className="px-4 py-3.5 text-right text-slate-400">
                                  {formatCurrency(cat.cost ?? 0)}
                                </td>
                                <td
                                  className={`px-4 py-3.5 text-right font-semibold ${isPositive ? "text-emerald-400" : "text-rose-400"
                                    }`}
                                >
                                  {formatCurrency(cat.grossProfit ?? 0)}
                                </td>
                                <td className="px-5 py-3.5 text-right">
                                  <span
                                    className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold border ${isPositive
                                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                      : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                      }`}
                                  >
                                    {Number(cat.profitMargin ?? 0).toFixed(2)}%
                                  </span>
                                </td>
                              </motion.tr>
                            );
                          })
                        )
                      ) : (financialData?.productBreakdown ?? []).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-14 text-slate-500">
                            No product sales data found for this period.
                          </td>
                        </tr>
                      ) : (
                        (financialData?.productBreakdown ?? []).map((prod, idx) => {
                          const isPositive = (prod.grossProfit ?? 0) >= 0;
                          return (
                            <motion.tr
                              key={prod.productId || idx}
                              initial={{ opacity: 0, y: 3 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.03 }}
                              className="hover:bg-slate-800/30 transition-colors"
                            >
                              <td className="px-5 py-3.5">
                                <div className="font-medium text-slate-200">{prod.productName}</div>
                                <div className="text-xs text-slate-500">{prod.categoryName}</div>
                              </td>
                              <td className="px-4 py-3.5 text-right font-mono text-slate-300">
                                {prod.unitsSold ?? 0}
                              </td>
                              <td className="px-4 py-3.5 text-right font-semibold text-emerald-400">
                                {formatCurrency(prod.revenue ?? 0)}
                              </td>
                              <td className="px-4 py-3.5 text-right text-slate-400">
                                {formatCurrency(prod.cost ?? 0)}
                              </td>
                              <td
                                className={`px-4 py-3.5 text-right font-semibold ${isPositive ? "text-emerald-400" : "text-rose-400"
                                  }`}
                              >
                                {formatCurrency(prod.grossProfit ?? 0)}
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                <span
                                  className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold border ${isPositive
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                    }`}
                                >
                                  {Number(prod.profitMargin ?? 0).toFixed(2)}%
                                </span>
                              </td>
                            </motion.tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* ── SALES SUMMARY TAB ─────────────────────────────────────────────── */}
      {activeTab === "sales" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Date Range Filter */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:items-end">
            <div className="space-y-1.5 flex-1 sm:flex-initial">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800/70 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition cursor-pointer"
              />
            </div>
            <div className="space-y-1.5 flex-1 sm:flex-initial">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800/70 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition cursor-pointer"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchSalesSummary}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition cursor-pointer"
              >
                Apply Filter
              </button>
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 text-sm transition cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {loading && !salesSummary ? (
            <div className="text-center py-20 text-slate-600">Loading…</div>
          ) : salesSummary ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  label="Total Revenue"
                  value={formatCurrency(salesSummary.totalRevenue ?? 0)}
                  icon={DollarSign}
                  color="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                />
                <StatCard
                  label="Total Transactions"
                  value={String(salesSummary.totalSalesCount ?? 0)}
                  icon={ShoppingCart}
                  color="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                />
                <StatCard
                  label="Avg Order Value"
                  value={formatCurrency(
                    salesSummary.averageOrderValue ??
                    (salesSummary.totalSalesCount
                      ? salesSummary.totalRevenue / salesSummary.totalSalesCount
                      : 0)
                  )}
                  icon={TrendingUp}
                  color="bg-purple-500/10 text-purple-400 border border-purple-500/20"
                />
              </div>

              {/* Top Products Table */}
              <div className="bg-slate-900/60 border border-slate-800/70 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800/70">
                  <h2 className="font-semibold text-slate-200 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    Top 5 Best-Selling Products
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800/70">
                        {["Rank", "Product", "SKU", "Units Sold", "Revenue Generated"].map((h) => (
                          <th
                            key={h}
                            className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const products =
                          salesSummary.topProducts ||
                          salesSummary.topSellingProducts?.map((item) => ({
                            productId: item.product?.id || "",
                            productName: item.product?.name || "Unknown",
                            sku: item.product?.sku || "—",
                            totalQuantitySold: item.totalQuantitySold,
                            totalRevenue: item.totalRevenue,
                          })) ||
                          [];

                        if (products.length === 0) {
                          return (
                            <tr>
                              <td colSpan={5} className="text-center py-12 text-slate-600">
                                No sales data for this period.
                              </td>
                            </tr>
                          );
                        }

                        return products.map((p, i) => (
                          <motion.tr
                            key={p.productId || i}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="border-b border-slate-800/40 hover:bg-slate-800/30 transition"
                          >
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold text-xs ${i === 0
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : i === 1
                                    ? "bg-slate-400/20 text-slate-300 border border-slate-400/30"
                                    : i === 2
                                      ? "bg-orange-700/20 text-orange-400 border border-orange-700/30"
                                      : "bg-slate-800 text-slate-500 border border-slate-700"
                                  }`}
                              >
                                {i + 1}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-200">{p.productName}</td>
                            <td className="px-4 py-3 text-xs font-mono text-slate-500">{p.sku}</td>
                            <td className="px-4 py-3 font-semibold text-indigo-400">
                              {p.totalQuantitySold}
                            </td>
                            <td className="px-4 py-3 font-semibold text-emerald-400">
                              {formatCurrency(p.totalRevenue)}
                            </td>
                          </motion.tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </motion.div>
      )}

      {/* ── LOW STOCK TAB ─────────────────────────────────────────────────── */}
      {activeTab === "low-stock" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Low Stock Items"
              value={String(lowStock.length)}
              icon={AlertTriangle}
              color="bg-amber-500/10 text-amber-400 border border-amber-500/20"
            />
            <StatCard
              label="Out of Stock"
              value={String(criticalCount)}
              icon={AlertTriangle}
              color={
                criticalCount > 0
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : "bg-slate-800 text-slate-500"
              }
            />
            <StatCard
              label="Needs Restocking"
              value={String(lowStock.length - criticalCount)}
              icon={TrendingUp}
              color="bg-orange-500/10 text-orange-400 border border-orange-500/20"
            />
          </div>

          <div className="bg-slate-900/60 border border-slate-800/70 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800/70">
              <h2 className="font-semibold text-slate-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Products Requiring Restocking
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800/70">
                    {[
                      "Product",
                      "SKU",
                      "Category",
                      "Supplier",
                      "Current Stock",
                      "Min Level",
                      "Deficit",
                      "Urgency",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-16 text-slate-600">
                        Loading…
                      </td>
                    </tr>
                  ) : lowStock.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-16 text-emerald-500">
                        ✓ All products are sufficiently stocked.
                      </td>
                    </tr>
                  ) : (
                    lowStock.map((item, i) => {
                      const deficit = item.minStockLevel - item.stockQuantity;
                      const isOut = item.stockQuantity === 0;
                      return (
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="border-b border-slate-800/40 hover:bg-slate-800/30 transition"
                        >
                          <td className="px-4 py-3 font-medium text-slate-200">{item.name}</td>
                          <td className="px-4 py-3 text-xs font-mono text-slate-500">{item.sku}</td>
                          <td className="px-4 py-3 text-slate-400">{item.category?.name ?? "—"}</td>
                          <td className="px-4 py-3 text-slate-400">{item.supplier?.name ?? "—"}</td>
                          <td className="px-4 py-3">
                            <span className={`font-bold ${isOut ? "text-red-400" : "text-amber-400"}`}>
                              {item.stockQuantity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500">{item.minStockLevel}</td>
                          <td className="px-4 py-3 text-red-400 font-semibold">-{deficit}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${isOut
                                ? "bg-red-500/10 text-red-400 border-red-500/20"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                }`}
                            >
                              {isOut ? "Critical" : "Low"}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
