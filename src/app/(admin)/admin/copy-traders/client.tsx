"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, ChevronLeft, ChevronRight, Pencil, Trash2, Camera, Loader2, Users } from "lucide-react";
import Link from "next/link";

interface CT {
  id: string; sn: number; bio: string | null;
  cumulativePnl: number; profitRate7d: number; profitRate30d: number; profitRate90d: number;
  maxDrawdown: number; profitShareRatio: number; accountInstruments: number;
  copiersCount: number; copiersEarnings: number;
  traderFirstName: string | null; traderLastName: string | null;
  traderCountry: string | null; traderGender: string | null; traderAvatar: string | null;
  user: { id: string; firstName: string; lastName: string; email: string; username: string } | null;
}

interface Props {
  copyTraders: CT[];
  total: number; page: number; pages: number; search: string;
  eligibleUsers: { id: string; firstName: string; lastName: string; email: string }[];
}

const BLANK_FORM = {
  userId: "", firstName: "", lastName: "", country: "", gender: "", sn: "0", bio: "",
  cumulativePnl: "0", profitRate7d: "0", profitRate30d: "0", profitRate90d: "0",
  maxDrawdown: "0", profitShareRatio: "0", accountInstruments: "0", copiersCount: "0", copiersEarnings: "0",
};

function shortPnl(n: number) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export function AdminCopyTradersClient({ copyTraders, total, page, pages, search: initSearch, eligibleUsers }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(initSearch);
  const [showAdd, setShowAdd] = useState(false);
  const [editCt, setEditCt] = useState<CT | null>(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  function displayName(ct: CT) {
    const first = ct.traderFirstName ?? ct.user?.firstName ?? "Unknown";
    const last = ct.traderLastName ?? ct.user?.lastName ?? "";
    return `${first} ${last}`.trim();
  }

  function openEdit(ct: CT) {
    setEditCt(ct);
    setForm({
      userId: ct.user?.id ?? "",
      firstName: ct.traderFirstName ?? "",
      lastName: ct.traderLastName ?? "",
      country: ct.traderCountry ?? "",
      gender: ct.traderGender ?? "",
      sn: String(ct.sn), bio: ct.bio || "",
      cumulativePnl: String(ct.cumulativePnl), profitRate7d: String(ct.profitRate7d),
      profitRate30d: String(ct.profitRate30d), profitRate90d: String(ct.profitRate90d),
      maxDrawdown: String(ct.maxDrawdown), profitShareRatio: String(ct.profitShareRatio),
      accountInstruments: String(ct.accountInstruments), copiersCount: String(ct.copiersCount),
      copiersEarnings: String(ct.copiersEarnings),
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    if (editCt) {
      const res = await fetch(`/api/admin/copy-traders/${editCt.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { setError("Failed to update"); setSaving(false); return; }
      setEditCt(null);
    } else {
      const res = await fetch("/api/admin/copy-traders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); setSaving(false); return; }
      setShowAdd(false);
    }
    setSaving(false);
    setForm(BLANK_FORM);
    router.refresh();
  }

  async function remove(id: string) {
    setDeleting(id);
    await fetch(`/api/admin/copy-traders/${id}`, { method: "DELETE" });
    setDeleting(null);
    router.refresh();
  }

  async function uploadImage(ctId: string, file: File) {
    setUploading(ctId);
    const formData = new FormData();
    formData.append("file", file);
    await fetch(`/api/admin/copy-traders/${ctId}`, { method: "PATCH", body: formData });
    setUploading(null);
    router.refresh();
  }

  function buildUrl(p: number) {
    const params = new URLSearchParams();
    params.set("page", String(p));
    if (initSearch) params.set("search", initSearch);
    return `/admin/copy-traders?${params.toString()}`;
  }

  const inp = "w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400";

  const F = ({ label, k, type = "number" }: { label: string; k: string; type?: string }) => (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
      <input type={type} step="any" value={(form as any)[k]} onChange={(e) => setForm((f: any) => ({ ...f, [k]: e.target.value }))} className={inp} />
    </div>
  );

  return (
    <main className="flex-1 p-6 space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { const p = new URLSearchParams(); if (search) p.set("search", search); router.push(`/admin/copy-traders?${p.toString()}`); }}}
            placeholder="Search traders..." className="w-full h-9 pl-9 pr-4 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400" />
        </div>
        <button onClick={() => { setForm(BLANK_FORM); setShowAdd(true); }} className="flex items-center gap-2 h-9 px-4 text-sm font-semibold text-white rounded-lg bg-black hover:bg-zinc-900 transition-colors">
          <Plus className="h-4 w-4" /> Add Copy Trader
        </button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {copyTraders.map((ct) => {
          const rawAvatar = ct.traderAvatar;
          const resolvedAvatar = rawAvatar ? rawAvatar.replace(/^user_\d+_/, "ct_") : null;
          const imageUrl = resolvedAvatar ? `/uploads/traders/${resolvedAvatar}` : null;
          const dicebearUrl = `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(displayName(ct))}&backgroundColor=111111&textColor=ffffff`;
          const profit30dPositive = ct.profitRate30d >= 0;
          return (
            <div key={ct.id} className="relative rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
              <div className={`h-0.5 w-full ${profit30dPositive ? "bg-linear-to-r from-emerald-400 to-emerald-500" : "bg-linear-to-r from-red-400 to-red-500"}`} />
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="relative group shrink-0">
                    <img
                      src={imageUrl ?? dicebearUrl}
                      alt={displayName(ct)}
                      onError={(e) => { (e.target as HTMLImageElement).src = dicebearUrl; }}
                      className="h-11 w-11 rounded-full object-cover ring-2 ring-slate-100"
                    />
                    <button
                      onClick={() => fileRefs.current[ct.id]?.click()}
                      disabled={uploading === ct.id}
                      className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      {uploading === ct.id ? <Loader2 className="h-3.5 w-3.5 text-white animate-spin" /> : <Camera className="h-3.5 w-3.5 text-white" />}
                    </button>
                    <input
                      ref={(el) => { fileRefs.current[ct.id] = el; }}
                      type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(ct.id, f); }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-900 truncate">{displayName(ct)}</p>
                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                      <Users className="h-3 w-3" />
                      <span>{ct.copiersCount.toLocaleString()} copiers</span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    <div className={`rounded-lg px-2.5 py-1 text-xs font-bold ${profit30dPositive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                      {profit30dPositive ? "+" : ""}{ct.profitRate30d.toFixed(1)}%
                    </div>
                    <button onClick={() => openEdit(ct)} className="h-7 w-7 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => remove(ct.id)} disabled={deleting === ct.id} className="h-7 w-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors disabled:opacity-60"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <div className="flex justify-between gap-2">
                  <div className="rounded-lg bg-slate-50 p-2 min-w-[30%]">
                    <p className="text-[10px] text-slate-400 mb-0.5">30D</p>
                    <p className={`text-sm font-bold ${ct.profitRate30d >= 0 ? "text-emerald-600" : "text-red-500"}`}>{ct.profitRate30d >= 0 ? "+" : ""}{ct.profitRate30d.toFixed(1)}%</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2 min-w-[30%]">
                    <p className="text-[10px] text-slate-400 mb-0.5">Instruments</p>
                    <p className="text-sm font-bold text-slate-700">{ct.accountInstruments}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2 min-w-[30%]">
                    <p className="text-[10px] text-slate-400 mb-0.5">Cum. PnL</p>
                    <p className="text-sm font-bold text-slate-700">{shortPnl(ct.cumulativePnl)}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {copyTraders.length === 0 && (
          <div className="col-span-3 text-center py-16 text-slate-400">No copy traders yet</div>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-slate-500">Page {page} of {pages} ({total} total)</p>
          <div className="flex items-center gap-1 flex-wrap">
            {page > 1 && <Link href={buildUrl(page - 1)} className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50"><ChevronLeft className="h-4 w-4 text-slate-600" /></Link>}
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <Link key={p} href={buildUrl(p)}
                className={`h-8 min-w-8 px-2 rounded-lg border text-xs font-medium flex items-center justify-center transition-colors ${p === page ? "bg-black text-white border-black" : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"}`}>
                {p}
              </Link>
            ))}
            {page < pages && <Link href={buildUrl(page + 1)} className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50"><ChevronRight className="h-4 w-4 text-slate-600" /></Link>}
          </div>
        </div>
      )}

      {(showAdd || editCt) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">{editCt ? "Edit Copy Trader" : "Add Copy Trader"}</h2>
              <button onClick={() => { setShowAdd(false); setEditCt(null); setError(""); }} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</p>}
              {!editCt && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Link to User *</label>
                  <select required value={form.userId} onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))} className={inp}>
                    <option value="">Select user</option>
                    {eligibleUsers.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>)}
                  </select>
                </div>
              )}
              <div className="pt-1 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Trader Profile</p>
                <div className="grid grid-cols-2 gap-4">
                  <F label="First Name" k="firstName" type="text" />
                  <F label="Last Name" k="lastName" type="text" />
                  <F label="Country" k="country" type="text" />
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Gender</label>
                    <select value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))} className={inp}>
                      <option value="">— select —</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bio</label>
                  <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} rows={2}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 resize-none" />
                </div>
              </div>
              <div className="pt-1 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Performance Stats</p>
                <div className="grid grid-cols-2 gap-4">
                  <F label="Serial No." k="sn" />
                  <F label="Copiers Count" k="copiersCount" />
                  <F label="Cumulative PnL %" k="cumulativePnl" />
                  <F label="7D Profit Rate %" k="profitRate7d" />
                  <F label="30D Profit Rate %" k="profitRate30d" />
                  <F label="90D Profit Rate %" k="profitRate90d" />
                  <F label="Max Drawdown %" k="maxDrawdown" />
                  <F label="Profit Share Ratio %" k="profitShareRatio" />
                  <F label="Instruments Traded" k="accountInstruments" />
                  <F label="Copiers Earnings ($)" k="copiersEarnings" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowAdd(false); setEditCt(null); setError(""); }} className="h-9 px-4 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="h-9 px-5 text-sm font-semibold text-white rounded-lg bg-black hover:bg-zinc-900 disabled:opacity-50 transition-colors">
                  {saving ? "Saving..." : (editCt ? "Update" : "Add Trader")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
