"use client";

import { usePathname } from "next/navigation";
import { Bell, Search, Menu, User, Shield, BadgeCheck, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import { signOut } from "next-auth/react";
import { SearchModal } from "@/components/dashboard/search-modal";
import { NotificationsPanel } from "@/components/dashboard/notifications-panel";

const pageTitles: Record<string, string> = {
  "/dashboard": "Discover",
  "/dashboard/fund-account": "Fund Account",
  "/dashboard/fund-portfolio": "Manage Funds",
  "/dashboard/withdraw": "Withdraw",
  "/dashboard/transactions": "Transactions",
  "/dashboard/trades": "My Trades",
  "/dashboard/expert-traders": "Expert Traders",
  "/dashboard/my-expert-traders": "My Copied Traders",
  "/dashboard/instruments": "Instruments",
  "/dashboard/market-buzz": "Market Buzz",
  "/dashboard/economic-calendar": "Economic Calendar",
  "/dashboard/academy": "Academy",
  "/dashboard/profile": "Profile",
  "/dashboard/security": "Security",
  "/dashboard/verification": "Verification",
  "/dashboard/referral": "Refer a Friend",
  "/dashboard/change-password": "Change Password",
};

interface TopbarUser {
  firstName: string;
  lastName: string;
  image: string | null;
  emailVerified: boolean;
  kycStatus: string;
}

export function DashboardTopbar({ user }: { user: TopbarUser }) {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "Dashboard";
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

  const avatarUrl = user.image
    || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(user.firstName + " " + user.lastName)}&backgroundColor=2a2a2a&textColor=ffffff`;

  const openSearch = useCallback(() => { setNotifOpen(false); setAvatarMenuOpen(false); setSearchOpen(true); }, []);
  const openNotif = useCallback(() => {
    setSearchOpen(false);
    setAvatarMenuOpen(false);
    setNotifOpen(true);
    setHasUnread(false);
    // Mark DB notifications as read
    fetch("/api/notifications", { method: "PATCH" }).catch(() => {});
  }, []);
  const toggleAvatarMenu = useCallback(() => { setSearchOpen(false); setNotifOpen(false); setAvatarMenuOpen((p) => !p); }, []);

  useEffect(() => {
    if (!avatarMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) setAvatarMenuOpen(false);
    };
    setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => document.removeEventListener("mousedown", handler);
  }, [avatarMenuOpen]);

  // Poll for unread notifications on mount and every 60s
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); openSearch(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [openSearch]);

  function openSidebar() {
    window.dispatchEvent(new CustomEvent("toggle-sidebar"));
  }

  return (
    <>
    <header className="sticky top-0 z-20 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-black lg:bg-white/95 lg:backdrop-blur-sm border-b border-white/10 lg:border-slate-200">
      {/* Mobile: logo */}
      <div className="flex lg:hidden items-center gap-2.5">
        <Image src="/media/logo3.png" alt="Pipnova" width={26} height={26} className="shrink-0" />
        <span className="text-base font-bold text-white">Pipnova</span>
      </div>

      {/* Desktop: page title + badges */}
      <div className="hidden lg:flex items-center gap-3">
        {pathname !== "/dashboard" && (
          <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        )}
        {!user.emailVerified && (
          <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-medium text-amber-700">
            Email unverified
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        {/* Search â€” all screen sizes */}
        <button
          onClick={openSearch}
          className="h-9 w-9 rounded-lg flex items-center justify-center transition-colors text-white/70 hover:text-white hover:bg-white/8 lg:text-slate-500 lg:hover:text-slate-700 lg:hover:bg-slate-100"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Bell â€” all screen sizes */}
        <button
          onClick={openNotif}
          className="h-9 w-9 rounded-lg flex items-center justify-center transition-colors relative text-white/70 hover:text-white hover:bg-white/8 lg:text-slate-500 lg:hover:text-slate-700 lg:hover:bg-slate-100"
        >
          <Bell className="h-4 w-4" />
          {hasUnread && <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-orange-400" />}
        </button>

        {/* Avatar with dropdown â€” all screen sizes */}
        <div className="relative ml-1" ref={avatarMenuRef}>
          <button onClick={toggleAvatarMenu} className="flex items-center">
            <img
              src={avatarUrl}
              alt={user.firstName}
              className="h-8 w-8 rounded-full object-cover border-2 border-white/20 lg:border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
            />
          </button>

          {avatarMenuOpen && (
            <div className="absolute right-0 top-9 w-52 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900 truncate">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-slate-400 truncate mt-0.5">Manage your account</p>
              </div>
              <div className="py-1">
                <Link href="/dashboard/profile" onClick={() => setAvatarMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <User className="h-4 w-4 text-slate-400" /> Profile
                </Link>
                <Link href="/dashboard/security" onClick={() => setAvatarMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <Shield className="h-4 w-4 text-slate-400" /> Security
                </Link>
                <Link href="/dashboard/verification" onClick={() => setAvatarMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <BadgeCheck className="h-4 w-4 text-slate-400" /> Verification
                </Link>
              </div>
              <div className="border-t border-slate-100 py-1">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hamburger â€” mobile only */}
        <button
          onClick={openSidebar}
          className="lg:hidden flex items-center justify-center text-white/80 hover:text-white transition-colors ml-1 cursor-default"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>
    </header>

    <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
}
