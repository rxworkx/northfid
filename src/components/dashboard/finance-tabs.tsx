import Link from "next/link";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Fund Account", href: "/dashboard/fund-account" },
  { label: "Manage Funds", href: "/dashboard/fund-portfolio" },
  { label: "Transactions", href: "/dashboard/transactions" },
  { label: "Withdraw", href: "/dashboard/withdraw" },
];

export function FinanceTabs({ active }: { active: string }) {
  return (
    <div className="flex gap-1 border-b border-slate-200">
      {tabs.map((tab) => {
        const isActive = tab.href.split("/").pop() === active;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              isActive
                ? "border-black text-black"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
