"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { Search, Plus, ChevronLeft, ChevronRight, Pencil, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Trade {
  id: string; sourceSymbol: string; targetSymbol: string; position: string;
  leverage: number; openingPrice: number; closingPrice: number | null;
  margin: number; profit: number | null; openingTime: string; closingTime: string | null;
  user: { id: string; firstName: string; lastName: string; email: string };
  instrument: { source: string; target: string };
}

interface Props {
  trades: Trade[];
  total: number; page: number; pages: number;
  search: string; status: string;
  instruments: { id: string; source: string; target: string }[];
  users: { id: string; firstName: string; lastName: string; email: string }[];
}

const BLANK_FORM = { userId: "", instrumentId: "", position: "long", leverage: "1", openingPrice: "", closingPrice: "", openingTime: "", closingTime: "", margin: "", profit: "" };

function shortDateTime(date: string) {
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(2);
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yy} ${hh}:${min}`;
}

export function AdminTradesClient({ trades, total, page, pages, search: initSearch, status: initStatus, instruments, users }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(initSearch);
  const [showAdd, setShowAdd] = useState(false);
  const [editTrade, setEditTrade] = useState<Trade | null>(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  function buildQuery(overrides: Record<string, string>) {
    const params = new URLSearchParams();
    const vals: Record<string, string> = { search, status: initStatus, ...overrides };
    Object.entries(vals).forEach(([k, v]) => { if (v) params.set(k, v); });
    return `/admin/trades?${params.toString()}`;
  }

  function openEdit(t: Trade) {
    setEditTrade(t);
    setForm({
      userId: t.user.id,
      instrumentId: "",
      position: t.position,
      leverage: String(t.leverage),
      openingPrice: String(t.openingPrice),
      closingPrice: t.closingPrice ? String(t.closingPrice) : "",
      openingTime: t.openingTime ? new Date(t.openingTime).toISOString().slice(0, 16) : "",
      closingTime: t.closingTime ? new Date(t.closingTime).toISOString().slice(0, 16) : "",
      margin: String(t.margin),
      profit: t.profit != null ? String(t.profit) : "",
    });
  }

  async function saveTrade(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    if (editTrade) {
      const res = await fetch(`/api/admin/trades/${editTrade.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { setError("Failed to update"); setSaving(false); return; }
      setEditTrade(null);
    } else {
      const res = await fetch("/api/admin/trades", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); setSaving(false); return; }
      setShowAdd(false);
    }
    setSaving(false);
    setForm(BLANK_FORM);
    router.refresh();
  }

  async function deleteTrade(id: string) {
    setDeleting(id);
    await fetch(`/api/admin/trades/${id}`, { method: "DELETE" });
    setDeleting(null);
    router.refresh();
  }

  const inputCls = "w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400";
  const selectCls = "w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400";

  const now = new Date();

  return (
    <main className="flex-1 p-6 space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && router.push(buildQuery({ search, page: "1" }))}
            placeholder="Search symbol, user..." className="w-full h-9 pl-9 pr-4 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400" />
        </div>
        <select value={initStatus} onChange={(e) => router.push(buildQuery({ status: e.target.value, page: "1" }))}
          className="h-9 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400">
          <option value="">All trades</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
        <button onClick={() => { setForm(BLANK_FORM); setShowAdd(true); }} className="flex items-center gap-2 h-9 px-4 text-sm font-semibold text-white rounded-lg bg-black hover:bg-zinc-900 transition-colors">
          <Plus className="h-4 w-4" /> Add Trade
        </button>
      </div>

      <div className="space-y-3 max-w-2xl">
        {trades.map((t) => {
          const profit = t.profit ?? null;
          const isProfit = profit !== null && profit >= 0;
          const isLong = t.position === "long";
          const isClosed = t.closingTime !== null && new Date(t.closingTime) <= now;
          return (
            <div key={t.id} className="bg-white rounded-lg overflow-hidden border border-slate-100">
              <div className={`h-1 w-full ${profit !== null ? (isProfit ? "bg-emerald-400" : "bg-red-400") : (isLong ? "bg-emerald-300" : "bg-red-300")}`} />
              <div className="px-4 py-3">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <span className={`font-medium ${isLong ? "text-emerald-600" : "text-red-500"}`}>{isLong ? "▲ Long" : "▼ Short"}</span>{" "}
                    <span className="font-semibold text-slate-800">{t.sourceSymbol}/{t.targetSymbol} {t.leverage}×</span>
                    <div className="text-slate-400 text-sm mt-0.5 flex items-center gap-1">
                      <span>{t.openingPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })}</span>
                      <ArrowRight className="h-3 w-3 shrink-0" />
                      {t.closingPrice !== null
                        ? <span>{t.closingPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })}</span>
                        : <span className="italic">pending</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 shrink-0">
                    {profit !== null
                      ? <span className={`font-semibold ${isProfit ? "text-emerald-600" : "text-red-500"}`}>{isProfit ? "+" : ""}{formatCurrency(profit)}</span>
                      : <span className="text-slate-300 font-semibold">—</span>}
                    <button onClick={() => openEdit(t)} className="h-7 w-7 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => deleteTrade(t.id)} disabled={deleting === t.id} className="h-7 w-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors disabled:opacity-60" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <div className="text-xs text-slate-400 flex items-center justify-between gap-x-3 mt-1">
                  <div className="flex items-center gap-x-3 flex-wrap gap-y-0.5">
                    <span className="flex items-center gap-1">
                      {shortDateTime(t.openingTime)}
                      {isClosed && t.closingTime
                        ? <><ArrowRight className="h-3 w-3 shrink-0" />{shortDateTime(t.closingTime)}</>
                        : <span className="inline-flex items-center gap-1 text-emerald-500 font-medium ml-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />Live</span>}
                    </span>
                    <span>Margin: {formatCurrency(t.margin)}</span>
                  </div>
                  <Link href={`/admin/users/${t.user.id}`} className="shrink-0 font-medium text-slate-500 hover:text-slate-700 transition-colors">
                    {t.user.firstName} {t.user.lastName}
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
        {trades.length === 0 && (
          <div className="rounded-xl bg-white border border-slate-100 py-12 text-center text-slate-400">No trades found</div>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between flex-wrap gap-2 max-w-2xl">
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

      {(showAdd || editTrade) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">{editTrade ? "Edit Trade" : "Add Trade"}</h2>
              <button onClick={() => { setShowAdd(false); setEditTrade(null); setError(""); }} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>
            <form onSubmit={saveTrade} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</p>}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">User *</label>
                  <select required value={form.userId} onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))} className={selectCls}>
                    <option value="">Select user</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>)}
                  </select>
                </div>
                {!editTrade && (
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Instrument *</label>
                    <select required value={form.instrumentId} onChange={(e) => setForm((f) => ({ ...f, instrumentId: e.target.value }))} className={selectCls}>
                      <option value="">Select instrument</option>
                      {instruments.map((i) => <option key={i.id} value={i.id}>{i.source}/{i.target}</option>)}
                    </select>
                  </div>
                )}
                {[
                  { label: "Position", el: <select value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))} className={selectCls}><option value="long">Long</option><option value="short">Short</option></select> },
                  { label: "Leverage", el: <input type="number" min="1" value={form.leverage} onChange={(e) => setForm((f) => ({ ...f, leverage: e.target.value }))} className={inputCls} /> },
                  { label: "Opening Price *", el: <input required type="number" step="any" value={form.openingPrice} onChange={(e) => setForm((f) => ({ ...f, openingPrice: e.target.value }))} className={inputCls} /> },
                  { label: "Closing Price", el: <input type="number" step="any" value={form.closingPrice} onChange={(e) => setForm((f) => ({ ...f, closingPrice: e.target.value }))} className={inputCls} /> },
                  { label: "Margin (USD) *", el: <input required type="number" step="0.01" value={form.margin} onChange={(e) => setForm((f) => ({ ...f, margin: e.target.value }))} className={inputCls} /> },
                  { label: "Profit/Loss (USD)", el: <input type="number" step="0.01" value={form.profit} onChange={(e) => setForm((f) => ({ ...f, profit: e.target.value }))} className={inputCls} /> },
                  { label: "Opening Time", el: <input type="datetime-local" value={form.openingTime} onChange={(e) => setForm((f) => ({ ...f, openingTime: e.target.value }))} className={inputCls} /> },
                  { label: "Closing Time", el: <input type="datetime-local" value={form.closingTime} onChange={(e) => setForm((f) => ({ ...f, closingTime: e.target.value }))} className={inputCls} /> },
                ].map(({ label, el }) => (
                  <div key={label}>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
                    {el}
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowAdd(false); setEditTrade(null); setError(""); }} className="h-9 px-4 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="h-9 px-5 text-sm font-semibold text-white rounded-lg bg-black hover:bg-zinc-900 disabled:opacity-50 transition-colors">
                  {saving ? "Saving..." : (editTrade ? "Update Trade" : "Add Trade")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
