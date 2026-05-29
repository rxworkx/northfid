import { formatCurrency } from "@/lib/utils";
import { Wallet, ArrowDownToLine, ArrowUpFromLine, BarChart2, TrendingUp, TrendingDown, Activity } from "lucide-react";

interface BalanceSummaryProps {
  balance: number;
  deposits: number;
  withdrawals: number;
  tradingVolume: number;
  totalProfit: number;
  totalLoss: number;
  activeTrades: number;
  firstName?: string;
}

export function BalanceSummary({ balance, deposits, withdrawals, tradingVolume, totalProfit, totalLoss, activeTrades }: BalanceSummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {/* Portfolio Balance */}
      <div className="rounded-2xl bg-black p-6 pb-7 text-white flex flex-col justify-between min-h-44">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-300">Portfolio Balance</span>
          </div>
          <p className="text-3xl font-bold tracking-tight">{formatCurrency(balance)}</p>
        </div>
        <div className="border-t border-white/10 pt-4 mt-5 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <ArrowDownToLine className="h-3 w-3 text-emerald-400" />
            <span className="text-xs text-slate-200">{formatCurrency(deposits)}</span>
            <span className="text-xs text-slate-400">deposited</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowUpFromLine className="h-3 w-3 text-amber-400" />
            <span className="text-xs text-slate-200">{formatCurrency(withdrawals)}</span>
            <span className="text-xs text-slate-400">withdrawn</span>
          </div>
        </div>
      </div>

      {/* Trading Volume */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 pb-7 flex flex-col justify-between min-h-44">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-500">Trading Volume</span>
          </div>
          <p className="text-3xl font-bold tracking-tight text-slate-900">{formatCurrency(tradingVolume)}</p>
        </div>
        <div className="border-t border-slate-100 pt-4 mt-5 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            <span className="text-xs font-medium text-slate-700">{formatCurrency(totalProfit)}</span>
            <span className="text-xs text-slate-400">profit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingDown className="h-3 w-3 text-red-400" />
            <span className="text-xs font-medium text-slate-700">{formatCurrency(Math.abs(totalLoss))}</span>
            <span className="text-xs text-slate-400">loss</span>
          </div>
        </div>
      </div>

      {/* Active Trades */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 pb-7 flex flex-col justify-between min-h-44">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-500">Active Trades</span>
          </div>
          <p className="text-3xl font-bold tracking-tight text-slate-900">{activeTrades}</p>
        </div>
        <p className="border-t border-slate-100 pt-4 mt-5 text-xs text-slate-400">Currently open positions</p>
      </div>
    </div>
  );
}
