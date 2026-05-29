"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Search, Plus, ChevronLeft, ChevronRight, ExternalLink, Mail, Loader2 } from "lucide-react";
import Link from "next/link";

const STATUS_CHIP: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  suspended: "bg-amber-100 text-amber-700 border-amber-200",
  banned: "bg-red-100 text-red-700 border-red-200",
};

const KYC_CHIP: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-700",
  none: "bg-slate-100 text-slate-500",
};

interface User {
  id: string; firstName: string; lastName: string; username: string;
  email: string; phone: string | null; country: string; status: string;
  role: string; emailVerified: boolean; isCopyTrader: boolean; mustResetPassword: boolean; createdAt: string;
  wallet: { balance: number } | null;
  kyc: { status: string } | null;
}

interface Props {
  users: User[];
  total: number;
  page: number;
  pages: number;
  search: string;
  status: string;
}

export function AdminUsersClient({ users, total, page, pages, search: initSearch, status: initStatus }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(initSearch);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [sendingResets, setSendingResets] = useState(false);
  const [resetResult, setResetResult] = useState<string | null>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", username: "", phone: "", password: "", country: "", role: "user", status: "active" });
  const [addError, setAddError] = useState("");

  function applyFilter(newSearch?: string, newStatus?: string) {
    const params = new URLSearchParams();
    const s = newSearch !== undefined ? newSearch : search;
    const st = newStatus !== undefined ? newStatus : initStatus;
    if (s) params.set("search", s);
    if (st) params.set("status", st);
    router.push(`/admin/users?${params.toString()}`);
  }

  async function sendResetEmails() {
    setSendingResets(true); setResetResult(null);
    const res = await fetch("/api/admin/send-reset-emails", { method: "POST" });
    const data = await res.json();
    setResetResult(res.ok ? `Sent ${data.sent} of ${data.total} reset emails` : "Failed to send emails");
    setSendingResets(false);
  }

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setAddError("");
    const res = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setAdding(false);
    if (!res.ok) { setAddError(data.error || "Failed to add user"); return; }
    setShowAdd(false);
    setForm({ firstName: "", lastName: "", email: "", username: "", phone: "", password: "", country: "", role: "user", status: "active" });
    router.refresh();
  }

  const pendingResets = users.filter(u => u.mustResetPassword).length;

  return (
    <main className="flex-1 p-6 space-y-5">
      {resetResult && (
        <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">{resetResult}</div>
      )}
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilter(search)}
            placeholder="Search users..."
            className="w-full h-9 pl-9 pr-4 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-100"
          />
        </div>
        <select
          value={initStatus}
          onChange={(e) => applyFilter(undefined, e.target.value)}
          className="h-9 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
        {pendingResets > 0 && (
          <button onClick={sendResetEmails} disabled={sendingResets}
            className="flex items-center gap-2 h-9 px-4 text-sm font-semibold text-white rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-50 transition-colors">
            {sendingResets ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Send Reset Emails ({pendingResets})
          </button>
        )}
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 h-9 px-4 text-sm font-semibold text-white rounded-lg bg-black hover:bg-zinc-900 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add User
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Balance</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">KYC</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Joined</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-black flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {u.firstName[0]}{u.lastName[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 truncate">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-slate-400 truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className="font-semibold text-slate-700">{formatCurrency(u.wallet?.balance ?? 0)}</span>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${KYC_CHIP[u.kyc?.status ?? "none"] ?? KYC_CHIP.none}`}>
                      {u.kyc?.status ?? "none"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap items-center gap-1">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_CHIP[u.status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                        {u.status}
                      </span>
                      {u.role === "admin" && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black text-white">ADMIN</span>
                      )}
                      {u.mustResetPassword && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200">RESET</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell text-slate-500 text-xs">{formatDate(u.createdAt)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/admin/users/${u.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors">
                      View <ExternalLink className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 flex-wrap gap-2">
            <p className="text-xs text-slate-500">Page {page} of {pages} ({total} total)</p>
            <div className="flex items-center gap-1 flex-wrap">
              {page > 1 && (
                <Link href={`/admin/users?page=${page - 1}${initSearch ? `&search=${initSearch}` : ""}${initStatus ? `&status=${initStatus}` : ""}`}
                  className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors">
                  <ChevronLeft className="h-4 w-4 text-slate-600" />
                </Link>
              )}
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <Link key={p} href={`/admin/users?page=${p}${initSearch ? `&search=${initSearch}` : ""}${initStatus ? `&status=${initStatus}` : ""}`}
                  className={`h-8 min-w-8 px-2 rounded-lg border text-xs font-medium flex items-center justify-center transition-colors ${p === page ? "bg-black text-white border-black" : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"}`}>
                  {p}
                </Link>
              ))}
              {page < pages && (
                <Link href={`/admin/users?page=${page + 1}${initSearch ? `&search=${initSearch}` : ""}${initStatus ? `&status=${initStatus}` : ""}`}
                  className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors">
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">Add New User</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>
            <form onSubmit={addUser} className="p-6 space-y-4">
              {addError && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{addError}</p>}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "First Name", key: "firstName", required: true },
                  { label: "Last Name", key: "lastName", required: true },
                  { label: "Email", key: "email", required: true, type: "email" },
                  { label: "Username", key: "username", required: true },
                  { label: "Phone", key: "phone" },
                  { label: "Country", key: "country" },
                  { label: "Password", key: "password", required: true, type: "password" },
                ].map(({ label, key, required, type }) => (
                  <div key={key} className={key === "email" || key === "password" ? "col-span-2" : ""}>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">{label}{required && " *"}</label>
                    <input
                      type={type || "text"}
                      required={required}
                      value={(form as any)[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:bg-white"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Role</label>
                  <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                    className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400">
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="banned">Banned</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="h-9 px-4 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={adding} className="h-9 px-5 text-sm font-semibold text-white rounded-lg bg-black hover:bg-zinc-900 disabled:opacity-50 transition-colors">
                  {adding ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
