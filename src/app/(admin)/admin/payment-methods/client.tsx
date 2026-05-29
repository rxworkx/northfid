"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, CreditCard, Bitcoin } from "lucide-react";

interface PM {
  id: string; title: string; type: string; symbol: string | null; currency: string;
  exchangeRate: number; walletAddress: string | null; accountNumber: string | null;
  routingNumber: string | null; bankName: string | null; accountName: string | null;
  enabled: boolean; forDeposit: boolean; forWithdrawal: boolean;
  livePriceEnabled: boolean; priceSymbol: string | null; orderIndex: number;
}

const BLANK: any = {
  title: "", type: "crypto", symbol: "", currency: "USD", exchangeRate: "1",
  walletAddress: "", accountNumber: "", routingNumber: "", bankName: "", accountName: "",
  enabled: true, forDeposit: true, forWithdrawal: true, livePriceEnabled: false, priceSymbol: "", orderIndex: "0",
};

export function AdminPaymentMethodsClient({ methods }: { methods: PM[] }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<PM | null>(null);
  const [form, setForm] = useState<any>(BLANK);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [error, setError] = useState("");

  function openEdit(m: PM) {
    setEditItem(m);
    setForm({ title: m.title, type: m.type, symbol: m.symbol ?? "", currency: m.currency, exchangeRate: String(m.exchangeRate), walletAddress: m.walletAddress ?? "", accountNumber: m.accountNumber ?? "", routingNumber: m.routingNumber ?? "", bankName: m.bankName ?? "", accountName: m.accountName ?? "", enabled: m.enabled, forDeposit: m.forDeposit, forWithdrawal: m.forWithdrawal, livePriceEnabled: m.livePriceEnabled, priceSymbol: m.priceSymbol ?? "", orderIndex: String(m.orderIndex) });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    const url = editItem ? `/api/admin/payment-methods/${editItem.id}` : "/api/admin/payment-methods";
    const method = editItem ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await res.json();
    setSaving(false);
    if (!res.ok) { setError(d.error || "Failed"); return; }
    setShowAdd(false); setEditItem(null); setForm(BLANK); router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this payment method?")) return;
    setDeleting(id);
    await fetch(`/api/admin/payment-methods/${id}`, { method: "DELETE" });
    setDeleting(null); router.refresh();
  }

  async function toggle(m: PM) {
    setToggling(m.id);
    await fetch(`/api/admin/payment-methods/${m.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: !m.enabled }) });
    setToggling(null); router.refresh();
  }

  const inputCls = "w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400";
  const isCrypto = form.type === "crypto";

  return (
    <main className="flex-1 p-6 space-y-5">
      <div className="flex justify-end">
        <button onClick={() => { setForm(BLANK); setShowAdd(true); }} className="flex items-center gap-2 h-9 px-4 text-sm font-semibold text-white rounded-lg bg-black hover:bg-zinc-900 transition-colors">
          <Plus className="h-4 w-4" /> Add Method
        </button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {methods.map((m) => (
          <div key={m.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-orange-200 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${m.type === "crypto" ? "bg-amber-100" : "bg-blue-100"}`}>
                  {m.type === "crypto" ? <Bitcoin className="h-5 w-5 text-amber-600" /> : <CreditCard className="h-5 w-5 text-blue-600" />}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{m.title}</p>
                  <p className="text-xs text-slate-500 capitalize">{m.type.replace("_", " ")} · {m.currency}</p>
                </div>
              </div>
              <button onClick={() => toggle(m)} disabled={toggling === m.id} className="transition-colors disabled:opacity-60">
                {m.enabled ? <ToggleRight className="h-5 w-5 text-emerald-500" /> : <ToggleLeft className="h-5 w-5 text-slate-300" />}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {m.forDeposit && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Deposit</span>}
              {m.forWithdrawal && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Withdrawal</span>}
              {m.livePriceEnabled && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Live Price</span>}
            </div>
            {m.walletAddress && <p className="text-xs font-mono text-slate-500 truncate mb-3">{m.walletAddress}</p>}
            {m.bankName && <p className="text-xs text-slate-500 mb-3">{m.bankName} · {m.accountNumber}</p>}
            <div className="flex gap-2">
              <button onClick={() => openEdit(m)} className="flex-1 h-8 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <button onClick={() => remove(m.id)} disabled={deleting === m.id} className="h-8 w-8 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center disabled:opacity-60">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
        {methods.length === 0 && <div className="col-span-3 text-center py-16 text-slate-400">No payment methods configured</div>}
      </div>

      {(showAdd || editItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">{editItem ? "Edit Payment Method" : "Add Payment Method"}</h2>
              <button onClick={() => { setShowAdd(false); setEditItem(null); setError(""); }} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</p>}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Title *</label>
                  <input required value={form.title} onChange={(e) => setForm((f: any) => ({ ...f, title: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Type *</label>
                  <select value={form.type} onChange={(e) => setForm((f: any) => ({ ...f, type: e.target.value }))} className={inputCls}>
                    <option value="crypto">Crypto</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Currency</label>
                  <input value={form.currency} onChange={(e) => setForm((f: any) => ({ ...f, currency: e.target.value }))} className={inputCls} />
                </div>
                {isCrypto ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Symbol (e.g. BTC)</label>
                      <input value={form.symbol} onChange={(e) => setForm((f: any) => ({ ...f, symbol: e.target.value }))} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Exchange Rate</label>
                      <input type="number" step="any" value={form.exchangeRate} onChange={(e) => setForm((f: any) => ({ ...f, exchangeRate: e.target.value }))} className={inputCls} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Wallet Address</label>
                      <input value={form.walletAddress} onChange={(e) => setForm((f: any) => ({ ...f, walletAddress: e.target.value }))} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Price Symbol</label>
                      <input value={form.priceSymbol} onChange={(e) => setForm((f: any) => ({ ...f, priceSymbol: e.target.value }))} placeholder="e.g. bitcoin" className={inputCls} />
                    </div>
                  </>
                ) : (
                  <>
                    {[["Bank Name", "bankName"], ["Account Name", "accountName"], ["Account Number", "accountNumber"], ["Routing Number", "routingNumber"]].map(([label, k]) => (
                      <div key={k}>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
                        <input value={form[k]} onChange={(e) => setForm((f: any) => ({ ...f, [k]: e.target.value }))} className={inputCls} />
                      </div>
                    ))}
                  </>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Order Index</label>
                  <input type="number" value={form.orderIndex} onChange={(e) => setForm((f: any) => ({ ...f, orderIndex: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                {[["enabled", "Enabled"], ["forDeposit", "For Deposit"], ["forWithdrawal", "For Withdrawal"], ["livePriceEnabled", "Live Price"]].map(([k, label]) => (
                  <label key={k} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form[k]} onChange={(e) => setForm((f: any) => ({ ...f, [k]: e.target.checked }))} className="rounded" />
                    <span className="text-sm font-medium text-slate-700">{label}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowAdd(false); setEditItem(null); setError(""); }} className="h-9 px-4 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="h-9 px-5 text-sm font-semibold text-white rounded-lg bg-black hover:bg-zinc-900 disabled:opacity-50 transition-colors">
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
