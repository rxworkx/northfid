"use client";

import { usePathname } from "next/navigation";

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

export function MobilePageTitle() {
  const pathname = usePathname();

  if (pathname === "/dashboard") return null;

  const title = pageTitles[pathname] ?? "Dashboard";

  return (
    <h1 className="lg:hidden text-xl font-bold text-slate-900 pb-4 mb-4 border-b border-slate-200">{title}</h1>
  );
}
