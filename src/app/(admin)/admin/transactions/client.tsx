"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Search, Plus, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import Link from "next/link";

const STATUS_CHIP: Record<string, string> = {
  confirmed: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
};

const TYPE_COLOR: Record<string, string> = {
  deposit: "text-emerald-600 font-semibold",
  withdrawal: "text-red-600 font-semibold",
  trade_profit: "text-slate-600",
  referral: "text-purple-600",
};

interface Tx {
  id: string; invoice: string; type: string; amount: number; status: string;
  paymentMethodTitle: string | null; createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string };
}

interface PaymentMethod {
  id: string; title: string; type: string; symbol: string | null;
}

interface Props {
  transactions: Tx[];
  total: number; page: number; pages: number;
  search: string; type: string; status: string;
  users: { id: string; firstName: string; lastName: string; email: string }[];
  paymentMethods: PaymentMethod[];
}

export function AdminTransactionsClient({ transactions, total, page, pages, search: initSearch, type: initType, status: initStatus, users, paymentMethods }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(initSearch);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ userId: "", type: "deposit", amount: "", status: "confirmed", paymentMethodId: "" });

  const [addError, setAddError] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [viewTx, setViewTx] = useState<Tx | null>(null);
  const [confirmFail, setConfirmFail] = useState(false);

  function buildQuery(overrides: Record<string, string>) {
    const params = new URLSearchParams();
    const vals: Record<string, string> = { search, type: initType, status: initStatus, ...overrides };
    Object.entries(vals).forEach(([k, v]) => { if (v) params.set(k, v); });
    return `/admin/transactions?${params.toString()}`;
  }

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    await fetch(`/api/admin/transactions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setUpdating(null);
    router.refresh();
  }

  async function deleteTx(id: string) {
    setDeleting(id);
    await fetch(`/api/admin/transactions/${id}`, { method: "DELETE" });
    setDeleting(null);
    router.refresh();
  }

  async function addTx(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true); setAddError("");
    const res = await fetch("/api/admin/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setAdding(false);
    if (!res.ok) { setAddError(data.error || "Failed"); return; }
    setShowAdd(false);
    router.refresh();
  }

  function closeView() {
    setViewTx(null);
    setConfirmFail(false);
  }

  return (
    <main className="flex-1 p-6 space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && router.push(buildQuery({ search, page: "1" }))}
            placeholder="Search invoice, user..." className="w-full h-9 pl-9 pr-4 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400" />
        </div>
        <select value={initType} onChange={(e) => router.push(buildQuery({ type: e.target.value, page: "1" }))}
          className="h-9 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400">
          <option value="">All types</option>
          <option value="deposit">Deposit</option>
          <option value="withdrawal">Withdrawal</option>
          <option value="trade_profit">Trade Profit</option>
          <option value="referral">Referral</option>
        </select>
        <select value={initStatus} onChange={(e) => router.push(buildQuery({ status: e.target.value, page: "1" }))}
          className="h-9 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="failed">Failed</option>
        </select>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 h-9 px-4 text-sm font-semibold text-white rounded-lg bg-black hover:bg-zinc-900 transition-colors">
          <Plus className="h-4 w-4" /> Add Transaction
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {["Invoice", "User", "Type", "Amount", "Method", "Status", "Date", "Actions"].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide first:pl-5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.map((tx) => (
                <tr key={tx.id} className={`transition-colors ${tx.status === "confirmed" ? "hover:bg-emerald-50/40 cursor-pointer" : "hover:bg-slate-50"}`}
                  onClick={tx.status === "confirmed" ? () => { setViewTx(tx); setConfirmFail(false); } : undefined}>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{tx.invoice}</td>
                  <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <Link href={`/admin/users/${tx.user.id}`} className="font-medium text-slate-800 hover:text-slate-900 transition-colors">{tx.user.firstName} {tx.user.lastName}</Link>
                    <p className="text-xs text-slate-400">{tx.user.email}</p>
                  </td>
                  <td className="px-5 py-3.5 capitalize"><span className={TYPE_COLOR[tx.type] ?? "text-slate-600"}>{tx.type.replace("_", " ")}</span></td>
                  <td className="px-5 py-3.5 font-semibold text-slate-800">{formatCurrency(tx.amount)}</td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">{tx.paymentMethodTitle || "—"}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_CHIP[tx.status] ?? "bg-slate-100 text-slate-600"}`}>{tx.status}</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">{formatDateTime(tx.createdAt)}</td>
                  <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      {tx.status === "pending" && (
                        <>
                          <button onClick={() => updateStatus(tx.id, "confirmed")} disabled={updating === tx.id}
                            className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition-colors disabled:opacity-60" title="Approve">
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => updateStatus(tx.id, "failed")} disabled={updating === tx.id}
                            className="h-7 w-7 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors disabled:opacity-60" title="Reject">
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {tx.status === "failed" && (
                        <>
                          <button onClick={() => updateStatus(tx.id, "pending")} disabled={updating === tx.id}
                            className="h-7 w-7 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 flex items-center justify-center transition-colors disabled:opacity-60" title="Restore to pending">
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => deleteTx(tx.id)} disabled={deleting === tx.id}
                            className="h-7 w-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors disabled:opacity-60" title="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-slate-400">No transactions found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 flex-wrap gap-2">
            <p className="text-xs text-slate-500">Page {page} of {pages} ({total} total)</p>
            <div className="flex items-center gap-1 flex-wrap">
              {page > 1 && <Link href={buildQuery({ page: String(page - 1) })} className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50"><ChevronLeft className="h-4 w-4 text-slate-600" /></Link>}
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <Link key={p} href={buildQuery({ page: String(p) })}
                  className={`h-8 min-w-8 px-2 rounded-lg border text-xs font-medium flex items-center justify-center transition-colors ${p === page ? "bg-black text-white border-black" : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"}`}>
                  {p}
                </Link>
              ))}
              {page < pages && <Link href={buildQuery({ page: String(page + 1) })} className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50"><ChevronRight className="h-4 w-4 text-slate-600" /></Link>}
            </div>
          </div>
        )}
      </div>

      {/* View Confirmed Transaction Modal */}
      {viewTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">Transaction Details</h2>
              <button onClick={closeView} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-3">
              {[
                { label: "Invoice", value: <span className="font-mono text-xs">{viewTx.invoice}</span> },
                { label: "User", value: `${viewTx.user.firstName} ${viewTx.user.lastName} (${viewTx.user.email})` },
                { label: "Type", value: <span className="capitalize">{viewTx.type.replace("_", " ")}</span> },
                { label: "Amount", value: <span className="font-semibold">{formatCurrency(viewTx.amount)}</span> },
                { label: "Method", value: viewTx.paymentMethodTitle || "—" },
                { label: "Date", value: formatDateTime(viewTx.createdAt) },
                { label: "Status", value: <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_CHIP[viewTx.status] ?? "bg-slate-100 text-slate-600"}`}>{viewTx.status}</span> },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wide">{label}</span>
                  <span className="text-slate-800">{value}</span>
                </div>
              ))}
            </div>

            <div className="px-6 pb-6 space-y-3">
              {confirmFail ? (
                <div className="rounded-xl bg-red-50 border border-red-200 p-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-red-800">Fail this transaction?</p>
                      <p className="text-xs text-red-600 mt-0.5">This will mark the transaction as failed. The user's balance may be affected depending on the transaction type.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={async () => { await updateStatus(viewTx.id, "failed"); closeView(); }} disabled={updating === viewTx.id}
                      className="flex-1 h-9 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50">
                      {updating === viewTx.id ? "Failing..." : "Yes, fail it"}
                    </button>
                    <button onClick={() => setConfirmFail(false)}
                      className="flex-1 h-9 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setConfirmFail(true)}
                    className="flex items-center justify-center gap-2 h-9 px-4 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200">
                    <XCircle className="h-4 w-4" /> Fail Transaction
                  </button>
                  <button onClick={closeView}
                    className="h-9 px-4 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">Add Transaction</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>
            <form onSubmit={addTx} className="p-6 space-y-4">
              {addError && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{addError}</p>}
              {[
                { label: "User *", el: <select required value={form.userId} onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))} className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"><option value="">Select user</option>{users.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>)}</select> },
                { label: "Type *", el: <select required value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"><option value="deposit">Deposit</option><option value="withdrawal">Withdrawal</option><option value="trade_profit">Trade Profit</option><option value="referral">Referral</option></select> },
                { label: "Amount (USD) *", el: <input required type="number" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400" /> },
                { label: "Status", el: <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"><option value="confirmed">Confirmed</option><option value="pending">Pending</option><option value="failed">Failed</option></select> },
                { label: "Payment Method", el: <select value={form.paymentMethodId} onChange={(e) => setForm((f) => ({ ...f, paymentMethodId: e.target.value }))} className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"><option value="">None</option>{paymentMethods.map((pm) => <option key={pm.id} value={pm.id}>{pm.title}{pm.symbol ? ` (${pm.symbol})` : ""}</option>)}</select> },
              ].map(({ label, el }) => (
                <div key={label}>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
                  {el}
                </div>
              ))}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="h-9 px-4 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={adding} className="h-9 px-5 text-sm font-semibold text-white rounded-lg bg-black hover:bg-zinc-900 disabled:opacity-50 transition-colors">
                  {adding ? "Adding..." : "Add Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
