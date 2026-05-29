"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, X, LayoutDashboard, Users, BarChart2 } from "lucide-react";

interface SearchResult {
  pages: { label: string; href: string }[];
  traders: { id: string; firstName: string; lastName: string; profitRate30d: number }[];
  instruments: { id: string; source: string; target: string }[];
}

const quickLinks = [
  { label: "Fund Account", href: "/dashboard/fund-account" },
  { label: "My Trades", href: "/dashboard/trades" },
  { label: "Expert Traders", href: "/dashboard/expert-traders" },
  { label: "Transactions", href: "/dashboard/transactions" },
  { label: "Profile", href: "/dashboard/profile" },
];

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult>({ pages: [], traders: [], instruments: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults({ pages: [], traders: [], instruments: [] });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); open ? onClose() : null; }
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!query.trim()) { setResults({ pages: [], traders: [], instruments: [] }); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        setResults(await res.json());
      } finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  if (!open) return null;

  const hasResults = results.pages.length > 0 || results.traders.length > 0 || results.instruments.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, traders, instruments..."
            className="flex-1 text-sm text-slate-900 placeholder-slate-400 outline-none bg-transparent"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto py-2">
          {!query.trim() && (
            <>
              <p className="px-4 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Quick Links</p>
              {quickLinks.map((p) => (
                <Link key={p.href} href={p.href} onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors">
                  <LayoutDashboard className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-800">{p.label}</span>
                </Link>
              ))}
            </>
          )}

          {query.trim() && loading && (
            <p className="px-4 py-8 text-center text-sm text-slate-400">Searching…</p>
          )}

          {query.trim() && !loading && !hasResults && (
            <p className="px-4 py-8 text-center text-sm text-slate-400">No results for &ldquo;{query}&rdquo;</p>
          )}

          {!loading && results.pages.length > 0 && (
            <>
              <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Pages</p>
              {results.pages.map((p) => (
                <Link key={p.href} href={p.href} onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors">
                  <LayoutDashboard className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-800">{p.label}</span>
                </Link>
              ))}
            </>
          )}

          {!loading && results.traders.length > 0 && (
            <>
              <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Expert Traders</p>
              {results.traders.map((t) => (
                <Link key={t.id} href={`/dashboard/expert-traders/${t.id}`} onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors">
                  <Users className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-800">{t.firstName} {t.lastName}</span>
                  <span className={`ml-auto text-xs font-medium ${t.profitRate30d >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {t.profitRate30d >= 0 ? "+" : ""}{t.profitRate30d.toFixed(1)}%
                  </span>
                </Link>
              ))}
            </>
          )}

          {!loading && results.instruments.length > 0 && (
            <>
              <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Instruments</p>
              {results.instruments.map((i) => (
                <Link key={i.id} href="/dashboard/instruments" onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors">
                  <BarChart2 className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-800">{i.source}/{i.target}</span>
                </Link>
              ))}
            </>
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-slate-100 flex items-center gap-3">
          <kbd className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">Esc</kbd>
          <span className="text-[10px] text-slate-400">to close</span>
          <kbd className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono ml-2">⌘K</kbd>
          <span className="text-[10px] text-slate-400">to open</span>
        </div>
      </div>
    </div>
  );
}
