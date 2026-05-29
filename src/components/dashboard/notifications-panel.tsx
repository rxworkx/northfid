"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine, TrendingUp, TrendingDown, Clock, X, ShieldAlert, PartyPopper } from "lucide-react";

interface NotifItem {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  time: string;
  href: string;
  read: boolean;
}

function relativeTime(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NotifIcon({ type, status }: { type: string; status: string }) {
  if (type === "welcome") return <PartyPopper className="h-4 w-4 text-orange-500" />;
  if (type === "new_login") return <ShieldAlert className="h-4 w-4 text-amber-500" />;
  if (type === "deposit") return <ArrowDownToLine className="h-4 w-4 text-emerald-500" />;
  if (type === "withdrawal") return <ArrowUpFromLine className="h-4 w-4 text-amber-500" />;
  if (type === "trade_closed" && status === "profit") return <TrendingUp className="h-4 w-4 text-emerald-500" />;
  if (type === "trade_closed") return <TrendingDown className="h-4 w-4 text-red-400" />;
  return <Clock className="h-4 w-4 text-slate-400" />;
}

function iconBg(type: string) {
  if (type === "welcome") return "bg-orange-50";
  if (type === "new_login") return "bg-amber-50";
  if (type === "deposit") return "bg-emerald-50";
  if (type === "withdrawal") return "bg-amber-50";
  return "bg-slate-100";
}

function descColor(status: string, type: string) {
  if (type === "new_login") return "text-amber-600";
  if (type === "welcome") return "text-orange-500";
  if (status === "profit" || status === "confirmed") return "text-emerald-600";
  if (status === "loss" || status === "failed") return "text-red-500";
  return "text-slate-500";
}

export function NotificationsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [items, setItems] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/notifications")
      .then((r) => r.text())
      .then((text) => {
        try { setItems(JSON.parse(text).notifications ?? []); } catch { setItems([]); }
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    const keyHandler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    setTimeout(() => document.addEventListener("mousedown", handler), 0);
    document.addEventListener("keydown", keyHandler);
    return () => { document.removeEventListener("mousedown", handler); document.removeEventListener("keydown", keyHandler); };
  }, [open, onClose]);

  if (!open) return null;

  const unread = items.filter((i) => !i.read).length;

  return (
    <div
      ref={panelRef}
      className="fixed top-17 right-4 lg:right-8 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-900">Notifications</p>
          {unread > 0 && (
            <span className="inline-flex items-center justify-center h-4.5 min-w-4.5 px-1.5 rounded-full bg-orange-500 text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-105 overflow-y-auto">
        {loading && (
          <div className="py-10 text-center text-sm text-slate-400">Loading…</div>
        )}
        {!loading && items.length === 0 && (
          <div className="py-10 text-center text-sm text-slate-400">No recent activity</div>
        )}
        {!loading && items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            onClick={onClose}
            className={`flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${!item.read ? "bg-orange-50/40" : ""}`}
          >
            <div className={`mt-0.5 h-8 w-8 rounded-full ${iconBg(item.type)} flex items-center justify-center shrink-0`}>
              <NotifIcon type={item.type} status={item.status} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
                {!item.read && <span className="shrink-0 h-1.5 w-1.5 rounded-full bg-orange-400" />}
              </div>
              <p className={`text-xs mt-0.5 leading-relaxed ${descColor(item.status, item.type)}`}>
                {item.description}
              </p>
            </div>
            <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">{relativeTime(item.time)}</span>
          </Link>
        ))}
      </div>

      <div className="px-4 py-2.5 border-t border-slate-100">
        <Link href="/dashboard/transactions" onClick={onClose} className="text-xs text-slate-500 hover:text-slate-800 transition-colors">
          View all transactions →
        </Link>
      </div>
    </div>
  );
}
