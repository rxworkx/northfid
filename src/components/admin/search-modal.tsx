"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search, X, LayoutDashboard, Users, ArrowLeftRight,
  Activity, Copy, BadgeCheck, BarChart2, CreditCard,
  BookOpen, Bell, Settings, Loader2,
} from "lucide-react";

const adminPages = [
  { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "All Users", href: "/admin/users", icon: <Users className="h-4 w-4" /> },
  { label: "Transactions", href: "/admin/transactions", icon: <ArrowLeftRight className="h-4 w-4" /> },
  { label: "Trades", href: "/admin/trades", icon: <Activity className="h-4 w-4" /> },
  { label: "Copy Traders", href: "/admin/copy-traders", icon: <Copy className="h-4 w-4" /> },
  { label: "KYC Review", href: "/admin/kyc", icon: <BadgeCheck className="h-4 w-4" /> },
  { label: "Instruments", href: "/admin/instruments", icon: <BarChart2 className="h-4 w-4" /> },
  { label: "Payment Methods", href: "/admin/payment-methods", icon: <CreditCard className="h-4 w-4" /> },
  { label: "Academy", href: "/admin/academy", icon: <BookOpen className="h-4 w-4" /> },
  { label: "Notifications", href: "/admin/notifications", icon: <Bell className="h-4 w-4" /> },
  { label: "Settings", href: "/admin/settings", icon: <Settings className="h-4 w-4" /> },
];

const quickLinks = adminPages.slice(0, 5);

interface UserResult { id: string; firstName: string; lastName: string; email: string }

export function AdminSearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setUsers([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); if (open) onClose(); }
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const filteredPages = query.trim()
    ? adminPages.filter((p) => p.label.toLowerCase().includes(query.toLowerCase()))
    : [];

  useEffect(() => {
    if (!query.trim()) { setUsers([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}&limit=5`);
        const data = await res.json();
        setUsers((data.users ?? []).slice(0, 5));
      } catch { setUsers([]); }
      finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  if (!open) return null;

  const hasResults = filteredPages.length > 0 || users.length > 0;

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
            placeholder="Search pages, users..."
            className="flex-1 text-sm text-slate-900 placeholder-slate-400 outline-none bg-transparent"
          />
          {loading && <Loader2 className="h-3.5 w-3.5 text-slate-400 animate-spin shrink-0" />}
          {query && !loading && (
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
                  <span className="text-slate-400">{p.icon}</span>
                  <span className="text-sm text-slate-800">{p.label}</span>
                </Link>
              ))}
            </>
          )}

          {query.trim() && !loading && !hasResults && (
            <p className="px-4 py-8 text-center text-sm text-slate-400">No results for &ldquo;{query}&rdquo;</p>
          )}

          {filteredPages.length > 0 && (
            <>
              <p className="px-4 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Pages</p>
              {filteredPages.map((p) => (
                <Link key={p.href} href={p.href} onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors">
                  <span className="text-slate-400">{p.icon}</span>
                  <span className="text-sm text-slate-800">{p.label}</span>
                </Link>
              ))}
            </>
          )}

          {users.length > 0 && (
            <>
              <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Users</p>
              {users.map((u) => (
                <Link key={u.id} href={`/admin/users/${u.id}`} onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors">
                  <Users className="h-4 w-4 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-slate-800 font-medium truncate">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                  </div>
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
