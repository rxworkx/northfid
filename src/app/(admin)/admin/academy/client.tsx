"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { Search, Plus, ChevronLeft, ChevronRight, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import Link from "next/link";

interface Article {
  id: string; title: string; description: string; category: string;
  published: boolean; orderIndex: number; thumbnail: string | null; createdAt: string;
}

interface Props {
  articles: Article[];
  total: number; page: number; pages: number;
  search: string; category: string;
  categories: { value: string; count: number }[];
}

const BLANK: any = { title: "", description: "", content: "", category: "", thumbnail: "", videoUrl: "", orderIndex: "0", published: true };

export function AdminAcademyClient({ articles, total, page, pages, search: initSearch, category: initCat, categories }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(initSearch);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<(Article & { content?: string; videoUrl?: string }) | null>(null);
  const [form, setForm] = useState<any>(BLANK);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loadingEdit, setLoadingEdit] = useState(false);

  function buildQ(ov: Record<string, string>) {
    const p = new URLSearchParams();
    const v = { search, category: initCat, ...ov };
    Object.entries(v).forEach(([k, val]) => { if (val) p.set(k, val); });
    return `/admin/academy?${p.toString()}`;
  }

  async function openEdit(a: Article) {
    setLoadingEdit(true);
    const res = await fetch(`/api/admin/academy/${a.id}`);
    const full = await res.json();
    setLoadingEdit(false);
    setEditItem(full);
    setForm({ title: full.title, description: full.description, content: full.content, category: full.category, thumbnail: full.thumbnail ?? "", videoUrl: full.videoUrl ?? "", orderIndex: String(full.orderIndex), published: full.published });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    const url = editItem ? `/api/admin/academy/${editItem.id}` : "/api/admin/academy";
    const method = editItem ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await res.json();
    setSaving(false);
    if (!res.ok) { setError(d.error || "Failed"); return; }
    setShowAdd(false); setEditItem(null); setForm(BLANK); router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this article?")) return;
    setDeleting(id);
    await fetch(`/api/admin/academy/${id}`, { method: "DELETE" });
    setDeleting(null); router.refresh();
  }

  async function togglePublished(a: Article) {
    setToggling(a.id);
    await fetch(`/api/admin/academy/${a.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ published: !a.published }) });
    setToggling(null); router.refresh();
  }

  const inputCls = "w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400";

  return (
    <main className="flex-1 p-6 space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && router.push(buildQ({ search, page: "1" }))}
            placeholder="Search articles..." className="w-full h-9 pl-9 pr-4 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400" />
        </div>
        <select value={initCat} onChange={(e) => router.push(buildQ({ category: e.target.value, page: "1" }))}
          className="h-9 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.value} value={c.value}>{c.value} ({c.count})</option>)}
        </select>
        <button onClick={() => { setForm(BLANK); setShowAdd(true); }} className="flex items-center gap-2 h-9 px-4 text-sm font-semibold text-white rounded-lg bg-black hover:bg-zinc-900 transition-colors">
          <Plus className="h-4 w-4" /> Add Article
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {["Title", "Category", "Published", "Order", "Date", ""].map((h) => (
                  <th key={h + Math.random()} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {articles.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-slate-800 truncate max-w-xs">{a.title}</p>
                    <p className="text-xs text-slate-400 truncate max-w-xs">{a.description}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{a.category}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => togglePublished(a)} disabled={toggling === a.id} className="transition-colors disabled:opacity-60">
                      {a.published ? <ToggleRight className="h-5 w-5 text-emerald-500" /> : <ToggleLeft className="h-5 w-5 text-slate-300" />}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{a.orderIndex}</td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">{formatDate(a.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEdit(a)} disabled={loadingEdit} className="h-7 w-7 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors disabled:opacity-60">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => remove(a.id)} disabled={deleting === a.id} className="h-7 w-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors disabled:opacity-60">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {articles.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">No articles yet</td></tr>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">{editItem ? "Edit Article" : "Add Article"}</h2>
              <button onClick={() => { setShowAdd(false); setEditItem(null); setError(""); }} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</p>}
              {[
                { label: "Title *", k: "title", req: true },
                { label: "Category *", k: "category", req: true, placeholder: "e.g. Basics, Forex, Crypto" },
                { label: "Thumbnail URL", k: "thumbnail" },
                { label: "Video URL", k: "videoUrl" },
              ].map(({ label, k, req, placeholder }) => (
                <div key={k}>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
                  <input required={req} value={form[k] ?? ""} onChange={(e) => setForm((f: any) => ({ ...f, [k]: e.target.value }))}
                    placeholder={placeholder} className={inputCls} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description *</label>
                <textarea required value={form.description} onChange={(e) => setForm((f: any) => ({ ...f, description: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Content * (HTML or Markdown)</label>
                <textarea required value={form.content} onChange={(e) => setForm((f: any) => ({ ...f, content: e.target.value }))} rows={8}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 resize-none font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Order Index</label>
                  <input type="number" value={form.orderIndex} onChange={(e) => setForm((f: any) => ({ ...f, orderIndex: e.target.value }))} className={inputCls} />
                </div>
                <div className="flex items-end pb-0.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.published} onChange={(e) => setForm((f: any) => ({ ...f, published: e.target.checked }))} className="rounded" />
                    <span className="text-sm font-medium text-slate-700">Published</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowAdd(false); setEditItem(null); setError(""); }} className="h-9 px-4 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="h-9 px-5 text-sm font-semibold text-white rounded-lg bg-black hover:bg-zinc-900 disabled:opacity-50 transition-colors">
                  {saving ? "Saving..." : "Save Article"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
