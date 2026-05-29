"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { ArrowLeft, Save, Trash2, ShieldCheck, Wallet, KeyRound } from "lucide-react";
import Link from "next/link";

const STATUS_CHIP: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  suspended: "bg-amber-100 text-amber-700",
  banned: "bg-red-100 text-red-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
};

export function AdminUserDetailClient({ user }: { user: any }) {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone || "",
    country: user.country || "",
    status: user.status,
    role: user.role,
    emailVerified: user.emailVerified,
    mustResetPassword: user.mustResetPassword ?? false,
    walletBalance: user.wallet?.balance?.toString() ?? "0",
    password: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function saveUser(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { setSaveMsg("Saved successfully"); router.refresh(); }
    else { setSaveMsg("Failed to save"); }
  }

  async function deleteUser() {
    setDeleting(true);
    await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    router.push("/admin/users");
  }

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
      {children}
    </div>
  );

  const inputCls = "w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:bg-white transition-colors";
  const selectCls = "w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400";

  return (
    <main className="flex-1 p-6 space-y-6">
      <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Users
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Edit Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {user.image
                ? <img src={user.image} alt={user.firstName} className="h-10 w-10 rounded-full object-cover border border-slate-200 shrink-0" />
                : <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-semibold text-slate-500 shrink-0">{user.firstName?.[0]}{user.lastName?.[0]}</div>
              }
              <h2 className="text-base font-semibold text-slate-900">User Details</h2>
            </div>
            <div className="flex items-center gap-2">
              {user.role === "admin" && (
                <span className="text-xs font-bold px-2 py-1 rounded-md text-white bg-slate-900">ADMIN</span>
              )}
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_CHIP[user.status] ?? "bg-slate-100 text-slate-600"}`}>{user.status}</span>
            </div>
          </div>

          <form onSubmit={saveUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name">
                <input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} className={inputCls} required />
              </Field>
              <Field label="Last Name">
                <input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} className={inputCls} required />
              </Field>
              <Field label="Email">
                <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} type="email" className={inputCls} required />
              </Field>
              <Field label="Phone">
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={inputCls} />
              </Field>
              <Field label="Country">
                <input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} className={inputCls} />
              </Field>
              <Field label="Wallet Balance (USD)">
                <input value={form.walletBalance} onChange={(e) => setForm((f) => ({ ...f, walletBalance: e.target.value }))} type="number" step="0.01" className={inputCls} />
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className={selectCls}>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="banned">Banned</option>
                </select>
              </Field>
              <Field label="Role">
                <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className={selectCls}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </Field>
              <Field label="Email Verified">
                <select value={form.emailVerified ? "true" : "false"} onChange={(e) => setForm((f) => ({ ...f, emailVerified: e.target.value === "true" }))} className={selectCls}>
                  <option value="true">Verified</option>
                  <option value="false">Not Verified</option>
                </select>
              </Field>
              <Field label="Force Password Reset">
                <select value={form.mustResetPassword ? "true" : "false"} onChange={(e) => setForm((f) => ({ ...f, mustResetPassword: e.target.value === "true" }))} className={selectCls}>
                  <option value="false">Not required</option>
                  <option value="true">Required on next login</option>
                </select>
              </Field>
              <Field label="New Password (leave blank to keep)">
                <input value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} type="password" placeholder="••••••••" className={inputCls} />
              </Field>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={saving} className="flex items-center gap-2 h-9 px-5 text-sm font-semibold text-white rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-colors">
                <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
              </button>
              {saveMsg && <span className={`text-sm ${saveMsg.includes("success") ? "text-emerald-600" : "text-red-600"}`}>{saveMsg}</span>}
            </div>
          </form>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          {/* Stats */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              {[
                { label: "Wallet Balance", value: formatCurrency(user.wallet?.balance ?? 0), icon: <Wallet className="h-4 w-4 text-emerald-500" /> },
                { label: "Total Transactions", value: user._count.transactions },
                { label: "Total Trades", value: user._count.trades },
                { label: "Referrals", value: user._count.referrals },
                { label: "KYC Status", value: user.kyc?.status ?? "none" },
                { label: "Password Reset", value: user.mustResetPassword ? "Required" : "Not required", icon: <KeyRound className={`h-4 w-4 ${user.mustResetPassword ? "text-amber-500" : "text-slate-300"}`} /> },
                { label: "Member Since", value: formatDate(user.createdAt) },
              ].map(({ label, value, icon }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-sm text-slate-600">{label}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-800">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-2xl border border-red-100 p-5">
            <h3 className="text-sm font-semibold text-red-700 mb-3">Danger Zone</h3>
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors">
                <Trash2 className="h-4 w-4" /> Delete this user
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-600">This will permanently delete the user and all their data. This cannot be undone.</p>
                <div className="flex gap-2">
                  <button onClick={deleteUser} disabled={deleting} className="h-8 px-3 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-60">
                    {deleting ? "Deleting..." : "Confirm Delete"}
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="h-8 px-3 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {["Invoice", "Type", "Amount", "Status", "Date"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {user.transactions.map((tx: any) => (
                <tr key={tx.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-mono text-xs text-slate-600">{tx.invoice}</td>
                  <td className="px-5 py-3 capitalize text-slate-700">{tx.type.replace("_", " ")}</td>
                  <td className="px-5 py-3 font-semibold text-slate-800">{formatCurrency(tx.amount)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_CHIP[tx.status] ?? "bg-slate-100 text-slate-600"}`}>{tx.status}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{formatDateTime(tx.createdAt)}</td>
                </tr>
              ))}
              {user.transactions.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-slate-400">No transactions</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Trades */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Recent Trades</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {["Instrument", "Position", "Margin", "P&L", "Status", "Date"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {user.trades.map((t: any) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">{t.instrument.source}/{t.instrument.target}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${t.position === "long" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{t.position}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-700">{formatCurrency(t.margin)}</td>
                  <td className="px-5 py-3 font-semibold" style={{ color: t.profit >= 0 ? "#059669" : "#dc2626" }}>{t.profit != null ? formatCurrency(t.profit) : "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${t.closingTime ? "bg-slate-100 text-slate-600" : "bg-blue-100 text-blue-700"}`}>
                      {t.closingTime ? "closed" : "open"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{formatDate(t.createdAt)}</td>
                </tr>
              ))}
              {user.trades.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">No trades</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
