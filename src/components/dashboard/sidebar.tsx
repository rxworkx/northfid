"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import {
  LayoutDashboard, Wallet, ArrowDownToLine,
  List, TrendingUp, Users, UserCheck, BookOpen, Shield,
  BadgeCheck, Gift, Globe, BarChart2, User, LogOut, X,
  Activity, Link2,
} from "lucide-react";
import { useState, useEffect } from "react";

interface SidebarUser {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  image: string;
  walletBalance: number;
  emailVerified: boolean;
  kycStatus: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  section?: string;
}

const navItems: NavItem[] = [
  { label: "Discover", href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Fund Account", href: "/dashboard/fund-account", icon: <ArrowDownToLine className="h-4 w-4" />, section: "Finance" },
  { label: "Manage Funds", href: "/dashboard/fund-portfolio", icon: <Wallet className="h-4 w-4" /> },
  { label: "Transactions", href: "/dashboard/transactions", icon: <List className="h-4 w-4" /> },
  { label: "My Trades", href: "/dashboard/trades", icon: <Activity className="h-4 w-4" />, section: "Trading" },
  { label: "Expert Traders", href: "/dashboard/expert-traders", icon: <Users className="h-4 w-4" /> },
  { label: "My Copied Traders", href: "/dashboard/my-expert-traders", icon: <UserCheck className="h-4 w-4" /> },
  { label: "Instruments", href: "/dashboard/instruments", icon: <BarChart2 className="h-4 w-4" /> },
  { label: "Academy", href: "/dashboard/academy", icon: <BookOpen className="h-4 w-4" />, section: "Research" },
  { label: "Market Buzz", href: "/dashboard/market-buzz", icon: <Globe className="h-4 w-4" /> },
  { label: "Economic Calendar", href: "/dashboard/economic-calendar", icon: <TrendingUp className="h-4 w-4" /> },
  { label: "Profile", href: "/dashboard/profile", icon: <User className="h-4 w-4" />, section: "Account" },
  { label: "Security", href: "/dashboard/security", icon: <Shield className="h-4 w-4" /> },
  { label: "Verification", href: "/dashboard/verification", icon: <BadgeCheck className="h-4 w-4" /> },
  { label: "Wallet Connect", href: "/dashboard/wallet-connect", icon: <Link2 className="h-4 w-4" /> },
  { label: "Refer a Friend", href: "/dashboard/referral", icon: <Gift className="h-4 w-4" /> },
];

export function DashboardSidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setMobileOpen(true);
    window.addEventListener("toggle-sidebar", handler);
    return () => window.removeEventListener("toggle-sidebar", handler);
  }, []);

  const avatarUrl = user.image
    || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(user.firstName + " " + user.lastName)}&backgroundColor=2a2a2a&textColor=ffffff`;

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/8 shrink-0">
        <Image src="/media/logo3.png" alt="Pipnova" width={28} height={28} className="shrink-0" />
        <span className="text-base font-bold text-white">Pipnova</span>
      </div>

      {/* User card */}
      <div className="mx-3 my-4 rounded-xl bg-white/6 border border-white/8 p-4 text-white">
        <div className="flex items-center gap-3 mb-3">
          <img
            src={avatarUrl}
            alt={user.firstName}
            className="h-10 w-10 rounded-full object-cover border-2 border-white/20"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-white/40 truncate">@{user.username}</p>
          </div>
        </div>
        <div>
          <p className="text-xs text-white/40">Portfolio Balance</p>
          <p className="text-lg font-bold">{formatCurrency(user.walletBalance)}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
        {navItems.map((item, i) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const prevItem = navItems[i - 1];
          const showSection = item.section && item.section !== prevItem?.section;

          const isDiscover = item.href === "/dashboard";

          return (
            <div key={item.href}>
              {showSection && (
                <p className="px-3 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                  {item.section}
                </p>
              )}
              <Link
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? isDiscover ? "border border-[rgba(240,112,32,0.35)] text-orange-400" : "border border-[rgba(240,112,32,0.35)] text-white"
                    : isDiscover ? "text-orange-400 hover:bg-white/6" : "text-slate-100 hover:bg-white/6 hover:text-white"
                )}
                style={isActive ? { background: "linear-gradient(135deg, #1e1e1e 0%, #2b1a0c 100%)" } : undefined}
              >
                <span className={isDiscover ? "text-orange-400" : (isActive ? "text-white" : "text-slate-200")}>{item.icon}</span>
                {item.label}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-4 border-t border-white/8 pt-3">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/50 hover:bg-white/6 hover:text-red-400 transition-all"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-black border-r border-white/8">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 bg-black flex flex-col shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-white/50"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
