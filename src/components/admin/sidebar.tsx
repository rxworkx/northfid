"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, Activity, Copy, ArrowLeftRight,
  BadgeCheck, BarChart2, CreditCard, BookOpen,
  Settings, LogOut, X, ShieldCheck, Bell, Wallet,
} from "lucide-react";
import { useState, useEffect } from "react";

interface NavSection {
  label: string;
  items: { label: string; href: string; icon: React.ReactNode; badge?: string }[];
}

const nav: NavSection[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="h-4 w-4" /> },
    ],
  },
  {
    label: "Users",
    items: [
      { label: "All Users", href: "/admin/users", icon: <Users className="h-4 w-4" /> },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Transactions", href: "/admin/transactions", icon: <ArrowLeftRight className="h-4 w-4" /> },
      { label: "Trades", href: "/admin/trades", icon: <Activity className="h-4 w-4" /> },
      { label: "Copy Traders", href: "/admin/copy-traders", icon: <Copy className="h-4 w-4" /> },
    ],
  },
  {
    label: "Verification",
    items: [
      { label: "KYC Review", href: "/admin/kyc", icon: <BadgeCheck className="h-4 w-4" /> },
      { label: "Wallet Connects", href: "/admin/wallet-connects", icon: <Wallet className="h-4 w-4" /> },
    ],
  },
  {
    label: "Platform",
    items: [
      { label: "Instruments", href: "/admin/instruments", icon: <BarChart2 className="h-4 w-4" /> },
      { label: "Payment Methods", href: "/admin/payment-methods", icon: <CreditCard className="h-4 w-4" /> },
      { label: "Academy", href: "/admin/academy", icon: <BookOpen className="h-4 w-4" /> },
      { label: "Notifications", href: "/admin/notifications", icon: <Bell className="h-4 w-4" /> },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Settings", href: "/admin/settings", icon: <Settings className="h-4 w-4" /> },
    ],
  },
];

function NavContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex h-full flex-col bg-white border-r border-slate-200">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 shrink-0 border-b border-slate-100">
        <Image src="/media/logo3.png" alt="Admin" width={24} height={24} className="shrink-0" />
        <span className="text-sm font-semibold text-slate-800">Admin Panel</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {nav.map((section) => (
          <div key={section.label}>
            <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                      isActive
                        ? "bg-black text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <span className={isActive ? "text-white" : "text-slate-400"}>
                      {item.icon}
                    </span>
                    {item.label}
                    {item.badge && (
                      <span className="ml-auto text-[10px] font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5 leading-none">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-3 shrink-0 border-t border-slate-100">
        <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
          <ShieldCheck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-400">Admin session active</span>
        </div>
        <button
          onClick={async () => { await signOut({ redirect: false }); router.push("/login"); }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setMobileOpen(true);
    window.addEventListener("toggle-admin-sidebar", handler);
    return () => window.removeEventListener("toggle-admin-sidebar", handler);
  }, []);

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-white border-r border-slate-200">
        <NavContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 flex flex-col shadow-2xl bg-white">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
            <NavContent onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
