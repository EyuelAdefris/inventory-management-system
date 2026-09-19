import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  Plus,
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Modal from "@/components/Modal";

interface StockMovement {
  id: string;
  createdAt: string;
  quantityChange: number;
  reason: string;
  notes?: string;
  product: { name: string; sku: string };
  user?: { name: string };
}

interface Product { id: string; name: string; sku: string; stockQuantity: number }

const inputCls = "w-full px-3 py-2 bg-slate-800/70 border border-slate-700/60 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition";

const REASONS = ["Restock", "Damaged", "Audit Adjustment", "Return", "Promotional", "Theft", "Expired", "Other"];

export default function StockMovements() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({ productId: "", quantityChange: 0, reason: "Restock", notes: "" });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [mRes, pRes] = await Promise.all([api.get("/stock-movements"), api.get("/products")]);
      setMovements(mRes.data);
      setProducts(pRes.data);
    } catch {
      toast.error("Failed to load stock movements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = movements.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.product.name.toLowerCase().includes(q) ||
      m.product.sku.toLowerCase().includes(q) ||
      m.reason.toLowerCase().includes(q)
    );
  });

  const handleAdjust = async () => {
    if (!form.productId || form.quantityChange === 0) {
      toast.error("Please select a product and enter a non-zero quantity.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/stock-movements/adjust", {
        productId: form.productId,
        quantityChange: form.quantityChange,
        reason: form.reason,
        notes: form.notes || undefined,
      });
      toast.success("Stock adjustment recorded!");
      setAdjustOpen(false);
      setForm({ productId: "", quantityChange: 0, reason: "Restock", notes: "" });
      fetchAll();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Adjustment failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const positives = movements.filter((m) => m.quantityChange > 0).length;
  const negatives = movements.filter((m) => m.quantityChange < 0).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Stock Adjustments</h1>
          <p className="text-sm text-slate-400 mt-1">Audit log of all inventory movements</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setAdjustOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Manual Adjustment
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/70 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <ArrowLeftRight className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Events</p>
            <p className="text-2xl font-bold text-slate-100 mt-0.5">{movements.length}</p>
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/70 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Additions</p>
            <p className="text-2xl font-bold text-emerald-400 mt-0.5">{positives}</p>
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/70 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
            <TrendingDown className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Reductions</p>
            <p className="text-2xl font-bold text-red-400 mt-0.5">{negatives}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by product or reason…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900/60 border border-slate-800/70 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition"
          />
        </div>
        <button onClick={fetchAll} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/70 text-slate-500 hover:text-slate-200 transition cursor-pointer self-start sm:self-auto" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-900/60 border border-slate-800/70 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/70">
                {["Product", "SKU", "Qty Change", "Reason", "Notes", "User", "Timestamp"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-16 text-slate-600">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-slate-600">No movements found.</td></tr>
              ) : filtered.map((m, i) => (
                <motion.tr
                  key={m.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-slate-800/40 hover:bg-slate-800/30 transition"
                >
                  <td className="px-4 py-3 font-medium text-slate-200">{m.product.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 font-mono">{m.product.sku}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 font-bold text-base ${m.quantityChange > 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {m.quantityChange > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {m.quantityChange > 0 ? "+" : ""}{m.quantityChange}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">{m.reason}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs max-w-[150px] truncate">{m.notes ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-400">{m.user?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{new Date(m.createdAt).toLocaleString()}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Adjustment Modal ───────────────────────────────────────────────── */}
      <Modal isOpen={adjustOpen} onClose={() => setAdjustOpen(false)} title="Manual Stock Adjustment" size="sm">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Product</label>
            <select className={inputCls} value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
              <option value="">Select product</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku}) — stock: {p.stockQuantity}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Quantity Change <span className="text-slate-600 normal-case">(negative to reduce)</span></label>
            <input type="number" className={inputCls} value={form.quantityChange} onChange={(e) => setForm({ ...form, quantityChange: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Reason</label>
            <select className={inputCls} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
              {REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Notes (optional)</label>
            <textarea rows={2} className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional context…" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setAdjustOpen(false)} className="px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 text-sm transition cursor-pointer">Cancel</button>
          <button onClick={handleAdjust} disabled={submitting} className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition disabled:opacity-50 cursor-pointer">
            {submitting ? "Saving…" : "Apply"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
