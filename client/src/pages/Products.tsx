import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  ArrowUpDown,
  Filter,
  RefreshCw,
  CheckCircle,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Modal from "@/components/Modal";

interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  isActive: boolean;
  categoryId?: string;
  supplierId?: string;
  category?: { id: string; name: string };
  supplier?: { id: string; name: string };
}

interface Category { id: string; name: string }
interface Supplier { id: string; name: string }

const emptyForm = {
  name: "", sku: "", description: "", categoryId: "", supplierId: "",
  costPrice: "", sellingPrice: "", stockQuantity: "", minStockLevel: "",
};

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className={`p-5 rounded-2xl bg-slate-900/60 border border-slate-800/70 backdrop-blur flex items-center gap-4`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-slate-100 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ── Form Field ───────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 bg-slate-800/70 border border-slate-700/60 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition";
const selectCls = inputCls;

export default function Products() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");

  // Modals
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);

  // Form state
  const [form, setForm] = useState(emptyForm);
  const [adjustQty, setAdjustQty] = useState<string | number>('');
  const [adjustReason, setAdjustReason] = useState("Restock");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [priceError, setPriceError] = useState("");

  // Clear validation errors when form fields change
  useEffect(() => {
    if (priceError) setPriceError("");
  }, [form]);

  // Category modal
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });

  // Supplier modal
  const [addSupplierOpen, setAddSupplierOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ name: "", contactPerson: "", email: "", phone: "", address: "" });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, cRes, sRes] = await Promise.all([
        api.get("/products"),
        api.get("/categories"),
        api.get("/suppliers"),
      ]);
      setProducts(pRes.data);
      setCategories(cRes.data);
      setSuppliers(sRes.data);
    } catch {
      toast.error("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    const matchLow = !filterLowStock || p.stockQuantity <= p.minStockLevel;
    const matchCat = !filterCategory || p.categoryId === filterCategory;
    return matchSearch && matchLow && matchCat;
  });

  const openEdit = (p: Product) => {
    setSelected(p);
    setPriceError("");
    setForm({
      name: p.name, sku: p.sku, description: p.description ?? "",
      categoryId: p.categoryId ?? "", supplierId: p.supplierId ?? "",
      costPrice: String(p.costPrice), sellingPrice: String(p.sellingPrice),
      stockQuantity: String(p.stockQuantity), minStockLevel: String(p.minStockLevel),
    });
    setEditOpen(true);
  };

  const openDelete = (p: Product) => { setSelected(p); setDeleteOpen(true); };
  const openStock = (p: Product) => { setSelected(p); setAdjustQty(''); setAdjustReason("Restock"); setAdjustNotes(""); setStockOpen(true); };

  const handleQuickSell = (p: Product) => {
    navigate('/sales', {
      state: {
        prefilledProduct: {
          id: p.id,
          name: p.name,
          sku: p.sku,
          sellingPrice: p.sellingPrice,
          stockQuantity: p.stockQuantity,
        },
        openModal: true,
      },
    });
  };

  const handleAdd = async () => {
    // Required fields validation
    if (!form.name.trim() || !form.sku.trim() || !form.categoryId || !form.supplierId || !form.costPrice || !form.sellingPrice) {
      setPriceError("Please fill in all required fields (Product Name, SKU, Category, Supplier, Cost Price, and Selling Price).");
      return;
    }
    // Pricing rule validation
    if (Number(form.sellingPrice) <= Number(form.costPrice)) {
      setPriceError("Selling price must be greater than cost price to ensure positive profit margin.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/products", {
        ...form,
        costPrice: parseFloat(form.costPrice),
        sellingPrice: parseFloat(form.sellingPrice),
        stockQuantity: parseInt(form.stockQuantity),
        minStockLevel: parseInt(form.minStockLevel),
        categoryId: form.categoryId || undefined,
        supplierId: form.supplierId || undefined,
      });
      toast.success("Product created!");
      setAddOpen(false);
      setForm(emptyForm);
      fetchAll();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to create product.");
    } finally {
      setSubmitting(false);
    }
  };



  const handleEdit = async () => {
    if (!selected) return;
    // Required fields validation
    if (!form.name.trim() || !form.sku.trim() || !form.categoryId || !form.supplierId || !form.costPrice || !form.sellingPrice) {
      setPriceError("Please fill in all required fields (Product Name, SKU, Category, Supplier, Cost Price, and Selling Price).");
      return;
    }
    // Pricing rule validation
    if (Number(form.sellingPrice) <= Number(form.costPrice)) {
      setPriceError("Selling price must be greater than cost price to ensure positive profit margin.");
      return;
    }
    setSubmitting(true);
    try {
      await api.put(`/products/${selected.id}`, {
        ...form,
        costPrice: parseFloat(form.costPrice),
        sellingPrice: parseFloat(form.sellingPrice),
        stockQuantity: parseInt(form.stockQuantity),
        minStockLevel: parseInt(form.minStockLevel),
        categoryId: form.categoryId || undefined,
        supplierId: form.supplierId || undefined,
      });
      toast.success("Product updated!");
      setEditOpen(false);
      fetchAll();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to update product.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCategory = async () => {
    setSubmitting(true);
    try {
      const res = await api.post("/categories", {
        name: categoryForm.name,
        description: categoryForm.description || undefined,
      });
      setCategories((prev) => [...prev, res.data]);
      setForm((prev) => ({ ...prev, categoryId: res.data.id }));
      toast.success("Category created!");
      setAddCategoryOpen(false);
      setCategoryForm({ name: "", description: "" });
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to create category.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSupplier = async () => {
    setSubmitting(true);
    try {
      const res = await api.post("/suppliers", {
        name: supplierForm.name,
        contactPerson: supplierForm.contactPerson || undefined,
        email: supplierForm.email || undefined,
        phone: supplierForm.phone || undefined,
        address: supplierForm.address || undefined,
      });
      setSuppliers((prev) => [...prev, res.data]);
      setForm((prev) => ({ ...prev, supplierId: res.data.id }));
      toast.success("Supplier created!");
      setAddSupplierOpen(false);
      setSupplierForm({ name: "", contactPerson: "", email: "", phone: "", address: "" });
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to create supplier.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await api.delete(`/products/${selected.id}`);
      toast.success("Product deactivated.");
      setDeleteOpen(false);
      fetchAll();
    } catch {
      toast.error("Failed to deactivate product.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjust = async () => {
    if (!selected) return;

    // Pre-validation
    const quantityDelta = Number(adjustQty);
    if (!selected.id) {
      toast.error("No product selected.");
      return;
    }
    if (isNaN(quantityDelta) || quantityDelta === 0) {
      toast.error("Quantity must be a non-zero number.");
      return;
    }
    if (!adjustReason.trim()) {
      toast.error("Please provide a reason for the stock adjustment.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        productId: selected.id,
        quantityDelta,
        reason: adjustReason.trim(),
        notes: adjustNotes || "",
      };
      await api.post("/stock-movements/adjust", payload);
      toast.success("Stock adjusted successfully!");
      setStockOpen(false);
      setAdjustQty('');
      setAdjustReason("Restock");
      setAdjustNotes("");
      fetchAll();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to adjust stock.");
    } finally {
      setSubmitting(false);
    }
  };

  const lowStockCount = products.filter((p) => p.stockQuantity <= p.minStockLevel).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Products</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your product catalog and inventory</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setForm(emptyForm); setPriceError(""); setAddOpen(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Products" value={products.length} icon={Package} color="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" />
        <StatCard label="Low Stock" value={lowStockCount} icon={AlertTriangle} color={lowStockCount > 0 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-slate-800 text-slate-500"} />
        <StatCard label="Active SKUs" value={products.filter(p => p.isActive).length} icon={CheckCircle} color="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" />
        <StatCard label="Categories" value={categories.length} icon={Filter} color="bg-purple-500/10 text-purple-400 border border-purple-500/20" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900/60 border border-slate-800/70 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2.5 bg-slate-900/60 border border-slate-800/70 rounded-xl text-sm text-slate-300 focus:outline-none cursor-pointer"
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button
          onClick={() => setFilterLowStock(!filterLowStock)}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition cursor-pointer ${filterLowStock ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-slate-900/60 border-slate-800/70 text-slate-400 hover:text-slate-200"}`}
        >
          <AlertTriangle className="w-4 h-4" />
          Low Stock
        </button>
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
                {["Name / SKU", "Category", "Supplier", "Cost", "Price", "Stock", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-16 text-slate-600">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-slate-600">No products found.</td></tr>
              ) : filtered.map((p, i) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-slate-800/40 hover:bg-slate-800/30 transition"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-200">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.sku}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{p.category?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-400">{p.supplier?.name || 'N/A'}</td>
                  <td className="px-4 py-3 text-slate-300">${Number(p.costPrice).toFixed(2)}</td>
                  <td className="px-4 py-3 text-emerald-400 font-medium">${Number(p.sellingPrice).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 font-semibold ${p.stockQuantity <= p.minStockLevel ? "text-amber-400" : "text-slate-200"}`}>
                      {p.stockQuantity <= p.minStockLevel && <AlertTriangle className="w-3 h-3" />}
                      {p.stockQuantity}
                    </span>
                    <span className="text-slate-600 text-xs ml-1">/ min {p.minStockLevel}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${p.isActive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-800 text-slate-500"}`}>
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleQuickSell(p)} title="Quick Sell" className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition cursor-pointer">
                        <ShoppingCart className="w-3.5 h-3.5" />
                      </button>
                      {isAdmin && (
                        <>
                          <button onClick={() => openStock(p)} title="Adjust Stock" className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition cursor-pointer">
                            <ArrowUpDown className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => openEdit(p)} title="Edit" className="p-1.5 rounded-lg text-slate-500 hover:text-sky-400 hover:bg-sky-500/10 transition cursor-pointer">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => openDelete(p)} title="Deactivate" className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add / Edit Modal (shared form) ───────────────────────────────── */}
      {[{ open: addOpen, onClose: () => setAddOpen(false), title: "Add Product", onSubmit: handleAdd },
        { open: editOpen, onClose: () => setEditOpen(false), title: "Edit Product", onSubmit: handleEdit }]
        .map(({ open, onClose, title, onSubmit }) => (
          <Modal key={title} isOpen={open} onClose={onClose} title={title} size="lg">
            {priceError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2.5 text-red-400 text-sm font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{priceError}</span>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Product Name">
                <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Office Chair" />
              </Field>
              <Field label="SKU">
                <input className={inputCls} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="e.g. SKU-001" />
              </Field>
              <Field label="Category">
                <div className="flex gap-2">
                  <select className={selectCls} value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => setAddCategoryOpen(true)}
                    title="Add Category"
                    className="px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-xl flex items-center justify-center transition cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </Field>
              <Field label="Supplier">
                <div className="flex gap-2">
                  <select className={selectCls} value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
                    <option value="">Select supplier</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => setAddSupplierOpen(true)}
                    title="Add Supplier"
                    className="px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-xl flex items-center justify-center transition cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </Field>
              <Field label="Cost Price ($)">
                <input type="number" min="0" step="0.01" className={inputCls} value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} placeholder="0.00" />
              </Field>
              <Field label="Selling Price ($)">
                <input type="number" min="0" step="0.01" className={inputCls} value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} placeholder="0.00" />
              </Field>
              <Field label="Stock Quantity">
                <input type="number" min="0" className={inputCls} value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} placeholder="0" />
              </Field>
              <Field label="Min Stock Level">
                <input type="number" min="0" className={inputCls} value={form.minStockLevel} onChange={(e) => setForm({ ...form, minStockLevel: e.target.value })} placeholder="5" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Description (optional)">
                  <textarea rows={2} className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short product description…" />
                </Field>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 text-sm transition cursor-pointer">Cancel</button>
              <button onClick={onSubmit} disabled={submitting} className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition disabled:opacity-50 cursor-pointer">
                {submitting ? "Saving…" : "Save"}
              </button>
            </div>
          </Modal>
        ))}

      {/* ── Delete Confirmation ───────────────────────────────────────────── */}
      <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Deactivate Product" size="sm">
        <p className="text-slate-300 text-sm">Are you sure you want to deactivate <strong className="text-white">{selected?.name}</strong>? This product will be hidden from listings but its history will be preserved.</p>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setDeleteOpen(false)} className="px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 text-sm transition cursor-pointer">Cancel</button>
          <button onClick={handleDelete} disabled={submitting} className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition disabled:opacity-50 cursor-pointer">
            {submitting ? "Deactivating…" : "Deactivate"}
          </button>
        </div>
      </Modal>

      {/* ── Stock Adjustment Modal ────────────────────────────────────────── */}
      <Modal isOpen={stockOpen} onClose={() => setStockOpen(false)} title={`Adjust Stock — ${selected?.name}`} size="sm">
        <div className="space-y-4">
          <Field label="Quantity Change (use negative to reduce)">
            <input type="number" className={inputCls} value={adjustQty} placeholder="e.g. 10 or -5" onChange={(e) => setAdjustQty(e.target.value === '' ? '' : Number(e.target.value))} />
          </Field>
          <Field label="Reason">
            <select className={selectCls} value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)}>
              {["Restock", "Damaged", "Audit Adjustment", "Return", "Other"].map((r) => <option key={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Notes (optional)">
            <textarea rows={2} className={inputCls} value={adjustNotes} onChange={(e) => setAdjustNotes(e.target.value)} placeholder="Additional context…" />
          </Field>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setStockOpen(false)} className="px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 text-sm transition cursor-pointer">Cancel</button>
          <button onClick={handleAdjust} disabled={submitting} className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition disabled:opacity-50 cursor-pointer">
            {submitting ? "Adjusting…" : "Apply Adjustment"}
          </button>
        </div>
      </Modal>

      {/* ── Category Modal ────────────────────────────────────────────────── */}
      <Modal isOpen={addCategoryOpen} onClose={() => setAddCategoryOpen(false)} title="New Category" size="sm">
        <div className="space-y-4">
          <Field label="Category Name *">
            <input className={inputCls} value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} placeholder="e.g. Electronics" />
          </Field>
          <Field label="Description (optional)">
            <textarea rows={2} className={inputCls} value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} placeholder="Category description…" />
          </Field>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setAddCategoryOpen(false)} className="px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 text-sm transition cursor-pointer">Cancel</button>
          <button onClick={handleAddCategory} disabled={submitting || !categoryForm.name.trim()} className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition disabled:opacity-50 cursor-pointer">
            {submitting ? "Saving…" : "Save"}
          </button>
        </div>
      </Modal>

      {/* ── Supplier Modal ────────────────────────────────────────────────── */}
      <Modal isOpen={addSupplierOpen} onClose={() => setAddSupplierOpen(false)} title="New Supplier" size="sm">
        <div className="space-y-4">
          <Field label="Supplier Name *">
            <input className={inputCls} value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} placeholder="e.g. Acme Corp" />
          </Field>
          <Field label="Contact Person (optional)">
            <input className={inputCls} value={supplierForm.contactPerson} onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })} placeholder="e.g. John Doe" />
          </Field>
          <Field label="Email (optional)">
            <input type="email" className={inputCls} value={supplierForm.email} onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })} placeholder="john@example.com" />
          </Field>
          <Field label="Phone (optional)">
            <input className={inputCls} value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} placeholder="e.g. +1 555 0123" />
          </Field>
          <Field label="Address (optional)">
            <textarea rows={2} className={inputCls} value={supplierForm.address} onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })} placeholder="Supplier address…" />
          </Field>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setAddSupplierOpen(false)} className="px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 text-sm transition cursor-pointer">Cancel</button>
          <button onClick={handleAddSupplier} disabled={submitting || !supplierForm.name.trim()} className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition disabled:opacity-50 cursor-pointer">
            {submitting ? "Saving…" : "Save"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
