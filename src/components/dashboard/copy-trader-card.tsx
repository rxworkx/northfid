"use client";

import Link from "next/link";
import { useState } from "react";
import { Users } from "lucide-react";
import { CopyButton } from "@/components/dashboard/copy-button";

interface Trader {
  id: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  avatar: string | null;
  profitRate30d: number;
  profitRate7d: number;
  profitRate90d: number;
  copiersCount: number;
  accountInstruments: number;
  cumulativePnl: number;
}

interface CopyTraderCardProps {
  trader: Trader;
  isCopied: boolean;
}

export function CopyTraderCard({ trader, isCopied }: CopyTraderCardProps) {
  const dicebearUrl = `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(trader.firstName + " " + trader.lastName)}&backgroundColor=111111&textColor=ffffff`;
  const [imgSrc, setImgSrc] = useState(trader.avatar ?? dicebearUrl);

  const profit30dPositive = trader.profitRate30d >= 0;

  function shortPnl(n: number) {
    if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
    return `$${n.toFixed(0)}`;
  }

  return (
    <div className="group relative rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      <div className={`h-0.5 w-full ${profit30dPositive ? "bg-linear-to-r from-emerald-400 to-emerald-500" : "bg-linear-to-r from-red-400 to-red-500"}`} />

      <Link href={`/dashboard/expert-traders/${trader.id}`} className="block p-4">
        <div className="flex items-start gap-3 mb-3">
          <img
            src={imgSrc}
            alt={trader.firstName}
            onError={() => setImgSrc(dicebearUrl)}
            className="h-11 w-11 rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-orange-100 transition-all shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-slate-900 group-hover:text-orange-600 transition-colors truncate">
              {trader.firstName} {trader.lastName}
            </p>
            <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
              <Users className="h-3 w-3" />
              <span>{trader.copiersCount.toLocaleString()} copiers</span>
            </div>
          </div>
          <div className="shrink-0" onClick={(e) => e.preventDefault()}>
            <CopyButton copyTraderId={trader.id} isCopied={isCopied} compact />
          </div>
        </div>

        <div className="flex justify-between gap-2">
          <div className="p-2 min-w-[30%]">
            <p className="text-[10px] text-slate-400 mb-0.5">30D</p>
            <p className={`text-sm font-bold ${trader.profitRate30d >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {trader.profitRate30d >= 0 ? "+" : ""}{trader.profitRate30d.toFixed(1)}%
            </p>
          </div>
          <div className="p-2 min-w-[30%]">
            <p className="text-[10px] text-slate-400 mb-0.5">Instruments</p>
            <p className="text-sm font-bold text-slate-700">{trader.accountInstruments}</p>
          </div>
          <div className="p-2 min-w-[30%]">
            <p className="text-[10px] text-slate-400 mb-0.5">Cum. PnL</p>
            <p className="text-sm font-bold text-slate-700">{shortPnl(trader.cumulativePnl)}</p>
          </div>
        </div>
      </Link>

    </div>
  );
}
