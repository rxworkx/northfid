"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Menu, Search, Bell, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { AdminSearchModal } from "@/components/admin/search-modal";
import { AdminNotificationsPanel } from "@/components/admin/notifications-panel";

interface AdminTopbarProps {
  title: string;
  subtitle?: string;
}

export function AdminTopbar({ title, subtitle }: AdminTopbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const openSearch = useCallback(() => {
    setNotifOpen(false);
    setSearchOpen(true);
  }, []);

  const openNotif = useCallback(() => {
    setSearchOpen(false);
    setNotifOpen(true);
    setHasUnread(false);
    fetch("/api/notifications", { method: "PATCH" }).catch(() => {});
  }, []);

  // Poll for unread notifications
  useEffect(() => {
    const check = () => {
      fetch("/api/notifications")
        .then((r) => r.json())
        .then((d) => { if (d.unreadCount > 0) setHasUnread(true); })
        .catch(() => {});
    };
    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [openSearch]);

  return (
    <>
      <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 sm:px-6 gap-4 shrink-0">
        <button
          className="lg:hidden h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
          onClick={() => window.dispatchEvent(new Event("toggle-admin-sidebar"))}
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-slate-900 truncate">{title}</h1>
          {subtitle && <p className="text-xs text-slate-400 truncate">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-1">
          {/* Search */}
          <button
            onClick={openSearch}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Bell */}
          <button
            onClick={openNotif}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {hasUnread && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-orange-400" />
            )}
          </button>

          {/* Admin avatar with dropdown */}
          <div className="relative ml-1" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="h-7 w-7 rounded-full bg-black flex items-center justify-center text-[11px] font-bold text-white select-none shrink-0 hover:bg-zinc-800 transition-colors"
            >
              A
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-50">
                <button
                  onClick={() => { setDropdownOpen(false); signOut({ callbackUrl: "/login" }); }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <AdminSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <AdminNotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
}
