import React, { useState, useEffect, useMemo } from "react";
import {
  Users as UsersIcon,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Search,
  Lock,
  KeyRound,
  Shield,
  User,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  Mail,
  Calendar,
  UserX,
  UserCheck2,
  Ban,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Modal from "@/components/Modal";
import { Navigate } from "react-router-dom";

export interface ManagedUser {
  id: string;
  username: string;
  name: string;
  email?: string | null;
  role: "ADMIN" | "STAFF";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    sales: number;
    stockAdjustments: number;
  };
}

const inputCls =
  "w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700/70 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 transition";
const selectCls =
  "w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700/70 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 transition";

function StatCard({
  label,
  value,
  icon: Icon,
  colorClass,
  bgClass,
}: {
  label: string;
  value: number | string;
  icon: any;
  colorClass: string;
  bgClass: string;
}) {
  return (
    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/70 backdrop-blur-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgClass}`}>
        <Icon className={`w-6 h-6 ${colorClass}`} />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-slate-100 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function Users() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);

  // Add User form state
  const [addForm, setAddForm] = useState({
    name: "",
    username: "",
    password: "",
    role: "STAFF" as "ADMIN" | "STAFF",
    email: "",
  });
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Edit Role form state
  const [newRole, setNewRole] = useState<"ADMIN" | "STAFF">("STAFF");
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);

  // Reset Password form state
  const [newPassword, setNewPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);

  // Status toggle state
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === "ADMIN") {
      fetchUsers();
    }
  }, [currentUser]);

  // Guard if non-admin attempts to access
  if (currentUser && currentUser.role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        (u.email && u.email.toLowerCase().includes(search.toLowerCase()));

      const matchesRole =
        roleFilter === "ALL" || u.role === roleFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && u.isActive) ||
        (statusFilter === "INACTIVE" && !u.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  // Counts
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const staffCount = users.filter((u) => u.role === "STAFF").length;
  const activeCount = users.filter((u) => u.isActive).length;
  const inactiveCount = users.filter((u) => !u.isActive).length;

  // Handle Add User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.username.trim() || !addForm.password.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (addForm.password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setIsSubmittingAdd(true);
    try {
      await api.post("/users", {
        name: addForm.name.trim(),
        username: addForm.username.trim().toLowerCase(),
        password: addForm.password,
        role: addForm.role,
        email: addForm.email.trim() || undefined,
      });

      toast.success(`User @${addForm.username} created successfully!`);
      setAddModalOpen(false);
      setAddForm({ name: "", username: "", password: "", role: "STAFF", email: "" });
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.response?.data?.error || "Failed to create user");
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Handle Update Role
  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSubmittingRole(true);
    try {
      await api.put(`/users/${selectedUser.id}/role`, { role: newRole });
      toast.success(`Role for @${selectedUser.username} updated to ${newRole}`);
      setRoleModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.response?.data?.error || "Failed to update user role");
    } finally {
      setIsSubmittingRole(false);
    }
  };

  // Handle Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setIsSubmittingReset(true);
    try {
      await api.put(`/users/${selectedUser.id}/reset-password`, { password: newPassword });
      toast.success(`Password for @${selectedUser.username} has been reset successfully!`);
      setPasswordModalOpen(false);
      setSelectedUser(null);
      setNewPassword("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.response?.data?.error || "Failed to reset password");
    } finally {
      setIsSubmittingReset(false);
    }
  };

  // Handle Toggle User Status (Activate / Deactivate)
  const handleToggleStatus = async () => {
    if (!selectedUser) return;

    setIsSubmittingStatus(true);
    try {
      await api.patch(`/users/${selectedUser.id}/status`);
      const action = selectedUser.isActive ? "deactivated" : "activated";
      toast.success(`Account @${selectedUser.username} has been ${action}.`);
      setStatusModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.response?.data?.error || "Failed to update user status");
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-7 pb-12">
      {/* ── Page Header ────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <UsersIcon className="w-6 h-6 text-indigo-400" />
            User Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage system access accounts, roles, and administrative credentials.
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm transition shadow-lg shadow-indigo-600/25 cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* ── Stats Overview ─────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total Accounts"
          value={totalUsers}
          icon={UsersIcon}
          colorClass="text-indigo-400"
          bgClass="bg-indigo-600/15 border border-indigo-500/20"
        />
        <StatCard
          label="Administrators"
          value={adminCount}
          icon={ShieldCheck}
          colorClass="text-purple-400"
          bgClass="bg-purple-600/15 border border-purple-500/20"
        />
        <StatCard
          label="Active Users"
          value={activeCount}
          icon={UserCheck}
          colorClass="text-emerald-400"
          bgClass="bg-emerald-600/15 border border-emerald-500/20"
        />
        <StatCard
          label="Deactivated"
          value={inactiveCount}
          icon={Ban}
          colorClass="text-rose-400"
          bgClass="bg-rose-600/15 border border-rose-500/20"
        />
      </div>

      {/* ── Filters & Search ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/70 backdrop-blur-sm p-3.5 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, username, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/60 transition cursor-pointer"
            >
              <option value="ALL">All ({totalUsers})</option>
              <option value="ADMIN">Admins ({adminCount})</option>
              <option value="STAFF">Staff ({staffCount})</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/60 transition cursor-pointer"
            >
              <option value="ALL">All</option>
              <option value="ACTIVE">Active ({activeCount})</option>
              <option value="INACTIVE">Inactive ({inactiveCount})</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Users Table ────────────────────────────────── */}
      <div className="bg-slate-900/60 border border-slate-800/70 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl shadow-black/20">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            <p className="text-sm">Loading user accounts...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/70 border border-slate-700 flex items-center justify-center text-slate-500">
              <UsersIcon className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-200">No users found</h3>
            <p className="text-sm text-slate-400 max-w-sm">
              {search || roleFilter !== "ALL" || statusFilter !== "ALL"
                ? "Try adjusting your search query or filters."
                : "Get started by adding your first system user account."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/50 text-xs uppercase font-semibold text-slate-400 tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Username</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((u) => {
                  const isSelf = currentUser?.id === u.id;
                  const isAdmin = u.role === "ADMIN";
                  const isDeactivated = !u.isActive;

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-800/30 transition-colors group ${isDeactivated ? "opacity-60" : ""}`}
                    >
                      {/* Name & Avatar */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${
                              isDeactivated
                                ? "bg-slate-700/40 border-slate-700/40 text-slate-500"
                                : isAdmin
                                ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-300"
                                : "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                            }`}
                          >
                            {getInitials(u.name)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-100">
                                {u.name}
                              </span>
                              {isSelf && (
                                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500">ID: {u.id.slice(0, 8)}...</span>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/70 text-slate-300">
                          @{u.username}
                        </span>
                      </td>

                      {/* Role Badge */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            isAdmin
                              ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
                              : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          }`}
                        >
                          {isAdmin ? (
                            <Shield className="w-3.5 h-3.5" />
                          ) : (
                            <User className="w-3.5 h-3.5" />
                          )}
                          {u.role}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            u.isActive
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                              : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                          }`}
                        >
                          {u.isActive ? (
                            <UserCheck2 className="w-3.5 h-3.5" />
                          ) : (
                            <UserX className="w-3.5 h-3.5" />
                          )}
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4">
                        {u.email ? (
                          <div className="flex items-center gap-1.5 text-slate-300 text-xs">
                            <Mail className="w-3.5 h-3.5 text-slate-500" />
                            <span>{u.email}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600 text-xs">Not specified</span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>
                            {new Date(u.createdAt).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Change Role Button */}
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setNewRole(u.role);
                              setRoleModalOpen(true);
                            }}
                            disabled={isSelf || isDeactivated}
                            title={isSelf ? "Cannot change your own role" : isDeactivated ? "Account is deactivated" : "Change User Role"}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Reset Password Button */}
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setNewPassword("");
                              setPasswordModalOpen(true);
                            }}
                            disabled={isDeactivated}
                            title={isDeactivated ? "Account is deactivated" : "Reset User Password"}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Lock className="w-4 h-4" />
                          </button>

                          {/* Activate / Deactivate Button */}
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setStatusModalOpen(true);
                            }}
                            disabled={isSelf}
                            title={
                              isSelf
                                ? "Cannot deactivate your own account"
                                : u.isActive
                                ? "Deactivate Account"
                                : "Activate Account"
                            }
                            className={`p-1.5 rounded-lg transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                              u.isActive
                                ? "text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                                : "text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                            }`}
                          >
                            {u.isActive ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal: Add User ────────────────────────────── */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Create New User Account"
        size="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. John Doe"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              className={inputCls}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Username *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. jdoe"
              value={addForm.username}
              onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
              className={inputCls}
            />
            <p className="text-[11px] text-slate-500">
              Unique identifier used for logging into the dashboard.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Password *
            </label>
            <div className="relative">
              <input
                type={showAddPassword ? "text" : "password"}
                required
                placeholder="At least 6 characters"
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                className={`${inputCls} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowAddPassword(!showAddPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition cursor-pointer"
              >
                {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                System Role *
              </label>
              <select
                value={addForm.role}
                onChange={(e) => setAddForm({ ...addForm, role: e.target.value as "ADMIN" | "STAFF" })}
                className={selectCls}
              >
                <option value="STAFF">STAFF (Standard)</option>
                <option value="ADMIN">ADMIN (Full Access)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Email Address (Optional)
              </label>
              <input
                type="email"
                placeholder="john@example.com"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-medium rounded-xl text-sm transition shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              {isSubmittingAdd ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create User</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Edit Role ───────────────────────────── */}
      <Modal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title="Update User Role"
        size="sm"
      >
        <form onSubmit={handleUpdateRole} className="space-y-4">
          <p className="text-sm text-slate-300">
            Modify the role permissions for{" "}
            <span className="font-semibold text-indigo-400">@{selectedUser?.username}</span>:
          </p>

          <div className="space-y-2">
            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                newRole === "STAFF"
                  ? "bg-slate-800 border-indigo-500/60 text-slate-100"
                  : "bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800/70"
              }`}
              onClick={() => setNewRole("STAFF")}
            >
              <input
                type="radio"
                name="roleOption"
                checked={newRole === "STAFF"}
                onChange={() => setNewRole("STAFF")}
                className="mt-1 accent-indigo-600"
              />
              <div>
                <span className="text-sm font-semibold block text-slate-100">Staff Member</span>
                <span className="text-xs text-slate-400">
                  Can process sales, view inventory, and record stock movements.
                </span>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                newRole === "ADMIN"
                  ? "bg-slate-800 border-indigo-500/60 text-slate-100"
                  : "bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800/70"
              }`}
              onClick={() => setNewRole("ADMIN")}
            >
              <input
                type="radio"
                name="roleOption"
                checked={newRole === "ADMIN"}
                onChange={() => setNewRole("ADMIN")}
                className="mt-1 accent-indigo-600"
              />
              <div>
                <span className="text-sm font-semibold block text-purple-300">Administrator</span>
                <span className="text-xs text-slate-400">
                  Full control over user accounts, financial reports, catalog, and system settings.
                </span>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setRoleModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingRole}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-medium rounded-xl text-sm transition cursor-pointer"
            >
              {isSubmittingRole ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Role</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Reset Password ──────────────────────── */}
      <Modal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title="Reset User Password"
        size="sm"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              You are assigning a new password for{" "}
              <strong className="text-white">@{selectedUser?.username}</strong>.
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              New Password *
            </label>
            <div className="relative">
              <input
                type={showResetPassword ? "text" : "password"}
                required
                placeholder="Enter at least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`${inputCls} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowResetPassword(!showResetPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition cursor-pointer"
              >
                {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              The user can use this new password immediately to log into the system.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setPasswordModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingReset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white font-medium rounded-xl text-sm transition cursor-pointer"
            >
              {isSubmittingReset ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Activate / Deactivate Confirmation ──── */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title={selectedUser?.isActive ? "Deactivate User Account" : "Activate User Account"}
        size="sm"
      >
        <div className="space-y-4">
          {selectedUser?.isActive ? (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5 text-xs text-rose-400">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Deactivating{" "}
                <strong className="text-white">{selectedUser?.name}</strong>{" "}
                (@{selectedUser?.username}) will prevent them from logging in.
                All their historical data will be preserved.
              </span>
            </div>
          ) : (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-2.5 text-xs text-emerald-400">
              <UserCheck2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Activating{" "}
                <strong className="text-white">{selectedUser?.name}</strong>{" "}
                (@{selectedUser?.username}) will restore their ability to log in.
              </span>
            </div>
          )}

          <p className="text-xs text-slate-400">
            {selectedUser?.isActive
              ? "Unlike permanent deletion, this is reversible. You can re-activate the account at any time."
              : "The user will regain full access to the system with their existing role and permissions."}
          </p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStatusModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={isSubmittingStatus}
              className={`inline-flex items-center gap-2 px-4 py-2 disabled:opacity-60 text-white font-medium rounded-xl text-sm transition cursor-pointer ${
                selectedUser?.isActive
                  ? "bg-rose-600 hover:bg-rose-500"
                  : "bg-emerald-600 hover:bg-emerald-500"
              }`}
            >
              {isSubmittingStatus ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : selectedUser?.isActive ? (
                <>
                  <UserX className="w-4 h-4" />
                  <span>Deactivate Account</span>
                </>
              ) : (
                <>
                  <UserCheck2 className="w-4 h-4" />
                  <span>Activate Account</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
