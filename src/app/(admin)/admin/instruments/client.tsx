"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, ChevronLeft, ChevronRight, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import Link from "next/link";

interface Instrument {
  id: string; source: string; target: string; enabled: boolean;
  livePriceEnabled: boolean; tradingViewSymbol: string | null;
  priceSymbol: string | null; bidPrice: number | null; askPrice: number | null;
}

interface Props {
  instruments: Instrument[];
  total: number; page: number; pages: number;
  search: string; enabled: string;
}

const BLANK = { source: "", target: "", tradingViewSymbol: "", priceSymbol: "", enabled: true, livePriceEnabled: false };

export function AdminInstrumentsClient({ instruments, total, page, pages, search: initSearch, enabled: initEnabled }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(initSearch);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<Instrument | null>(null);
  const [form, setForm] = useState<any>(BLANK);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [error, setError] = useState("");

  function buildQ(ov: Record<string, string>) {
    const p = new URLSearchParams();
    const v = { search, enabled: initEnabled, ...ov };
    Object.entries(v).forEach(([k, val]) => { if (val) p.set(k, val); });
    return `/admin/instruments?${p.toString()}`;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    if (editItem) {
      const res = await fetch(`/api/admin/instruments/${editItem.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { setError("Failed"); setSaving(false); return; }
      setEditItem(null);
    } else {
      const res = await fetch("/api/admin/instruments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await res.json();
      if (!res.ok) { setError(d.error || "Failed"); setSaving(false); return; }
      setShowAdd(false);
    }
    setSaving(false); setForm(BLANK); router.refresh();
  }

  async function toggleEnabled(item: Instrument) {
    setToggling(item.id);
    await fetch(`/api/admin/instruments/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: !item.enabled }) });
    setToggling(null); router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this instrument?")) return;
    setDeleting(id);
    await fetch(`/api/admin/instruments/${id}`, { method: "DELETE" });
    setDeleting(null); router.refresh();
  }

  const inputCls = "w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400";

  return (
    <main className="flex-1 p-6 space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && router.push(buildQ({ search, page: "1" }))}
            placeholder="Search symbol..." className="w-full h-9 pl-9 pr-4 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400" />
        </div>
        <select value={initEnabled} onChange={(e) => router.push(buildQ({ enabled: e.target.value, page: "1" }))}
          className="h-9 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400">
          <option value="">All</option>
          <option value="true">Enabled</option>
          <option value="false">Disabled</option>
        </select>
        <button onClick={() => { setForm(BLANK); setShowAdd(true); }} className="flex items-center gap-2 h-9 px-4 text-sm font-semibold text-white rounded-lg bg-black hover:bg-zinc-900 transition-colors">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {["Pair", "TradingView Symbol", "Price Symbol", "Bid/Ask", "Live Price", "Enabled", ""].map((h) => (
                  <th key={h + Math.random()} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {instruments.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-slate-800">{item.source}/{item.target}</td>
                  <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">{item.tradingViewSymbol ?? "—"}</td>
                  <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">{item.priceSymbol ?? "—"}</td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">{item.bidPrice != null ? `${item.bidPrice} / ${item.askPrice}` : "—"}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${item.livePriceEnabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {item.livePriceEnabled ? "on" : "off"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => toggleEnabled(item)} disabled={toggling === item.id} className="transition-colors disabled:opacity-60">
                      {item.enabled
                        ? <ToggleRight className="h-5 w-5 text-emerald-500" />
                        : <ToggleLeft className="h-5 w-5 text-slate-300" />}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => { setEditItem(item); setForm({ source: item.source, target: item.target, tradingViewSymbol: item.tradingViewSymbol ?? "", priceSymbol: item.priceSymbol ?? "", enabled: item.enabled, livePriceEnabled: item.livePriceEnabled }); }}
                        className="h-7 w-7 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => remove(item.id)} disabled={deleting === item.id}
                        className="h-7 w-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors disabled:opacity-60">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {instruments.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">No instruments found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 flex-wrap gap-2">
            <p className="text-xs text-slate-500">Page {page} of {pages} ({total} total)</p>
            <div className="flex items-center gap-1 flex-wrap">
              {page > 1 && <Link href={buildQ({ page: String(page - 1) })} className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50"><ChevronLeft className="h-4 w-4 text-slate-600" /></Link>}
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <Link key={p} href={buildQ({ page: String(p) })}
                  className={`h-8 min-w-8 px-2 rounded-lg border text-xs font-medium flex items-center justify-center transition-colors ${p === page ? "bg-black text-white border-black" : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"}`}>
                  {p}
                </Link>
              ))}
              {page < pages && <Link href={buildQ({ page: String(page + 1) })} className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50"><ChevronRight className="h-4 w-4 text-slate-600" /></Link>}
            </div>
          </div>
        )}
      </div>

      {(showAdd || editItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">{editItem ? "Edit Instrument" : "Add Instrument"}</h2>
              <button onClick={() => { setShowAdd(false); setEditItem(null); setError(""); }} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</p>}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Source Symbol *", k: "source", req: true },
                  { label: "Target Symbol *", k: "target", req: true },
                  { label: "TradingView Symbol", k: "tradingViewSymbol" },
                  { label: "Price Symbol", k: "priceSymbol" },
                ].map(({ label, k, req }) => (
                  <div key={k}>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
                    <input required={req} value={form[k] ?? ""} onChange={(e) => setForm((f: any) => ({ ...f, [k]: e.target.value.toUpperCase() }))} className={inputCls} />
                  </div>
                ))}
              </div>
              <div className="flex gap-6">
                {[
                  { label: "Enabled", k: "enabled" },
                  { label: "Live Price", k: "livePriceEnabled" },
                ].map(({ label, k }) => (
                  <label key={k} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form[k] ?? false} onChange={(e) => setForm((f: any) => ({ ...f, [k]: e.target.checked }))} className="rounded" />
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
