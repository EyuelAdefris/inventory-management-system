import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Eye,
  RefreshCw,
  DollarSign,
  Hash,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import Modal from "@/components/Modal";

interface Product {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  stockQuantity: number;
}

interface SaleItem {
  productId: string;
  quantity: string | number;
  unitPrice: number;
}

interface SaleRecord {
  id: string;
  createdAt: string;
  totalAmount: number;
  user?: { id: string; name: string; username?: string; email?: string | null; role: string };
  items?: { quantity: number; unitPrice: number; product?: { name: string; sku: string; supplier?: { id: string; name: string } } }[];
  saleItems?: { quantity: number; unitPrice: number; product?: { name: string; sku: string; supplier?: { id: string; name: string } } }[];
}

const inputCls = "w-full px-3 py-2 bg-slate-800/70 border border-slate-700/60 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition";

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/70 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}><Icon className="w-5 h-5" /></div>
      <div>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-slate-100 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function Sales() {
  const location = useLocation();
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Cart for new sale
  const [items, setItems] = useState<SaleItem[]>([{ productId: "", quantity: '', unitPrice: 0 }]);

  const fetchSales = async () => {
    try {
      const response = await api.get("/sales");
      console.log("API Sales Data Received:", response.data);
      setSales(response.data);
    } catch (err) {
      console.error("Failed to fetch sales:", err);
      toast.error("Failed to load sales.");
    }
  };

  const fetchProducts = async () => {
    try {
      const pRes = await api.get("/products");
      setProducts(pRes.data);
    } catch (err) {
      console.error("Failed to load products:", err);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchSales(), fetchProducts()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
    fetchProducts().finally(() => setLoading(false));
  }, []);

  // Auto-open New Sale modal when navigated from Quick Sell
  useEffect(() => {
    const state = location.state as { prefilledProduct?: { id: string; name: string; sku: string; sellingPrice: number; stockQuantity: number }; openModal?: boolean } | null;
    if (state?.prefilledProduct && state?.openModal) {
      const p = state.prefilledProduct;
      setItems([{ productId: p.id, quantity: '', unitPrice: p.sellingPrice }]);
      setCreateOpen(true);
      // Clear router state so a refresh doesn't re-open the modal
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const filteredSales = sales.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.id.toLowerCase().includes(q) ||
      (s.user?.name.toLowerCase().includes(q) ?? false)
    );
  });

  // Cart helpers
  const updateItem = (index: number, field: keyof SaleItem, value: string | number) => {
    const next = [...items];
    if (field === "productId") {
      const prod = products.find((p) => p.id === value);
      next[index] = { ...next[index], productId: value as string, unitPrice: prod?.sellingPrice ?? 0 };
    } else {
      (next[index] as any)[field] = value;
    }
    setItems(next);
  };

  const addItem = () => setItems([...items, { productId: "", quantity: '', unitPrice: 0 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const cartTotal = items.reduce((sum, it) => sum + Number(it.quantity) * it.unitPrice, 0);

  const handleCreateSale = async () => {
    const validItems = items.filter((it) => it.productId && Number(it.quantity) >= 1);
    if (validItems.length === 0 || validItems.length !== items.length) {
      toast.error("Please fill all items with a valid product and quantity (minimum 1).");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/sales", { items: validItems.map((it) => ({ ...it, quantity: Number(it.quantity) })) });
      toast.success("Sale recorded successfully!");
      setCreateOpen(false);
      setItems([{ productId: "", quantity: '', unitPrice: 0 }]);
      fetchAll();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to create sale.");
    } finally {
      setSubmitting(false);
    }
  };

  const openReceipt = (s: SaleRecord) => { setSelectedSale(s); setReceiptOpen(true); };

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const totalUnitsSold = sales.reduce((total, sale) => {
    const items = sale.items || sale.saleItems || [];
    const saleQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    return total + saleQuantity;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Sales</h1>
          <p className="text-sm text-slate-400 mt-1">Process new transactions and review sales history</p>
        </div>
        <button
          onClick={() => { setItems([{ productId: "", quantity: '', unitPrice: 0 }]); setCreateOpen(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Sale
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} icon={DollarSign} color="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" />
        <StatCard label="Total Transactions" value={String(sales.length)} icon={Hash} color="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" />
        <StatCard label="Units Sold" value={String(totalUnitsSold)} icon={TrendingUp} color="bg-purple-500/10 text-purple-400 border border-purple-500/20" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by sale ID or user…"
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
                {["Sale ID", "Date & Time", "Processed By", "Total Amount", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-16 text-slate-600">Loading…</td></tr>
              ) : filteredSales.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16 text-slate-600">No sales found.</td></tr>
              ) : filteredSales.map((s, i) => (
                <motion.tr
                  key={s.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-slate-800/40 hover:bg-slate-800/30 transition"
                >
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{s.id.slice(0, 8)}…</td>
                  <td className="px-4 py-3 text-slate-300">{new Date(s.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-400">{s.user?.name || '—'}</td>
                  <td className="px-4 py-3 text-emerald-400 font-semibold">${Number(s.totalAmount).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openReceipt(s)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 border border-transparent hover:border-sky-500/20 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Receipt
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create Sale Modal ──────────────────────────────────────────────── */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="New Sale" size="lg">
        <div className="space-y-4">
          {items.map((item, idx) => {
            const prod = products.find((p) => p.id === item.productId);
            return (
              <div key={idx} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Item {idx + 1}</span>
                  {items.length > 1 && (
                    <button onClick={() => removeItem(idx)} className="text-slate-600 hover:text-red-400 transition cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-500 mb-1">Product</label>
                    <select
                      className={inputCls}
                      value={item.productId}
                      onChange={(e) => updateItem(idx, "productId", e.target.value)}
                    >
                      <option value="">Select product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.sku}) — stock: {p.stockQuantity}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Qty</label>
                    <input
                      type="number"
                      min="1"
                      max={prod?.stockQuantity ?? 9999}
                      className={inputCls}
                      value={item.quantity}
                      placeholder="Enter quantity"
                      onChange={(e) => updateItem(idx, "quantity", e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </div>
                </div>
                {prod && (
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Unit price: <span className="text-emerald-400">${Number(item.unitPrice).toFixed(2)}</span></span>
                    <span>Subtotal: <span className="text-emerald-400 font-semibold">${(Number(item.quantity || 0) * Number(item.unitPrice || 0)).toFixed(2)}</span></span>
                  </div>
                )}
              </div>
            );
          })}

          <button onClick={addItem} className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition cursor-pointer">
            <Plus className="w-4 h-4" />
            Add another item
          </button>

          <div className="flex items-center justify-between p-4 rounded-xl bg-indigo-600/10 border border-indigo-500/20">
            <span className="font-semibold text-slate-300">Total</span>
            <span className="text-xl font-bold text-emerald-400">${cartTotal.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setCreateOpen(false)} className="px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 text-sm transition cursor-pointer">Cancel</button>
          <button onClick={handleCreateSale} disabled={submitting} className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition disabled:opacity-50 cursor-pointer">
            {submitting ? "Processing…" : "Confirm Sale"}
          </button>
        </div>
      </Modal>

      {/* ── Receipt Modal ─────────────────────────────────────────────────── */}
      <Modal isOpen={receiptOpen} onClose={() => setReceiptOpen(false)} title="Sale Receipt" size="lg">
        {selectedSale && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-500">Sale ID</span><p className="font-mono text-xs text-slate-300 mt-0.5">{selectedSale.id}</p></div>
              <div><span className="text-slate-500">Date</span><p className="text-slate-300 mt-0.5">{new Date(selectedSale.createdAt).toLocaleString()}</p></div>
              <div><span className="text-slate-500">Processed by</span><p className="text-slate-300 mt-0.5">{selectedSale.user?.name ?? "—"}</p></div>
              <div><span className="text-slate-500">Total</span><p className="text-emerald-400 font-bold text-lg mt-0.5">${Number(selectedSale.totalAmount).toFixed(2)}</p></div>
            </div>
            {((selectedSale.items || selectedSale.saleItems) ?? []).length > 0 && (
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-800/60">
                      <th className="text-left px-3 py-2 text-slate-500">Product</th>
                      <th className="text-left px-3 py-2 text-slate-500">Supplier</th>
                      <th className="text-right px-3 py-2 text-slate-500">Qty</th>
                      <th className="text-right px-3 py-2 text-slate-500">Unit</th>
                      <th className="text-right px-3 py-2 text-slate-500">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedSale.items || selectedSale.saleItems || []).map((si, i) => (
                      <tr key={i} className="border-t border-slate-800/50">
                        <td className="px-3 py-2 text-slate-300">{si.product?.name ?? "N/A"}</td>
                        <td className="px-3 py-2 text-slate-400">{si.product?.supplier?.name || "N/A"}</td>
                        <td className="px-3 py-2 text-right text-slate-400">{si.quantity}</td>
                        <td className="px-3 py-2 text-right text-slate-400">${Number(si.unitPrice).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right text-emerald-400 font-medium">${(si.quantity * Number(si.unitPrice)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
