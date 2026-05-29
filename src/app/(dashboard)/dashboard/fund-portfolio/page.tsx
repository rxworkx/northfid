import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge, statusBadgeVariant } from "@/components/ui/badge";
import Link from "next/link";
import {
  ArrowDownToLine, ArrowUpFromLine, ExternalLink,
  TrendingUp, TrendingDown, Wallet, BarChart2, ArrowRight,
} from "lucide-react";

export const metadata = { title: "Manage Funds" };

export default async function FundPortfolioPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [user, depositAgg, withdrawalAgg, profitAgg, lossAgg, deposits, withdrawals, recentTrades] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { wallet: { select: { balance: true } } } }),
    db.transaction.aggregate({ where: { userId, type: "deposit", status: "confirmed" }, _sum: { amount: true } }),
    db.transaction.aggregate({ where: { userId, type: "withdrawal", status: "confirmed" }, _sum: { amount: true } }),
    db.transaction.aggregate({ where: { userId, type: "trade_profit", status: "confirmed" }, _sum: { amount: true } }),
    db.trade.aggregate({ where: { userId, profit: { lt: 0 } }, _sum: { profit: true } }),
    db.transaction.findMany({ where: { userId, type: "deposit" }, orderBy: { createdAt: "desc" }, take: 8 }),
    db.transaction.findMany({ where: { userId, type: "withdrawal" }, orderBy: { createdAt: "desc" }, take: 8 }),
    db.trade.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5, include: { instrument: { select: { source: true, target: true } } } }),
  ]);

  const balance = (user as any)?.wallet?.balance ?? 0;
  const totalDeposits = depositAgg._sum.amount ?? 0;
  const totalWithdrawals = withdrawalAgg._sum.amount ?? 0;
  const totalProfit = profitAgg._sum.amount ?? 0;
  const totalLoss = Math.abs(lossAgg._sum.profit ?? 0);
  const netPnl = totalProfit - totalLoss;

  return (
    <div className="max-w-5xl space-y-8">

      {/* Hero balance card */}
      <div
        className="relative rounded-2xl overflow-hidden bg-black text-white p-7"
      >
        <div className="absolute right-0 top-0 h-60 w-60 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-2">Available Balance</p>
          <p className="text-5xl font-bold tracking-tight mb-6">{formatCurrency(balance)}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/fund-account"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-400 px-4 py-2.5 text-sm font-semibold transition-colors"
            >
              <ArrowDownToLine className="h-4 w-4" /> Deposit
            </Link>
            <Link
              href="/dashboard/withdraw"
              className="inline-flex items-center gap-2 rounded-xl bg-white/8 hover:bg-white/14 border border-white/12 px-4 py-2.5 text-sm font-medium transition-colors"
            >
              <ArrowUpFromLine className="h-4 w-4" /> Withdraw
            </Link>
            <Link
              href="/dashboard/transactions"
              className="inline-flex items-center gap-2 rounded-xl bg-white/8 hover:bg-white/14 border border-white/12 px-4 py-2.5 text-sm font-medium transition-colors"
            >
              Full History <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Deposited", value: totalDeposits, icon: <ArrowDownToLine className="h-4 w-4 text-emerald-500" />, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Total Withdrawn", value: totalWithdrawals, icon: <ArrowUpFromLine className="h-4 w-4 text-amber-500" />, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Trading Profit", value: totalProfit, icon: <TrendingUp className="h-4 w-4 text-purple-500" />, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Net P&L", value: netPnl, icon: <BarChart2 className="h-4 w-4 text-slate-500" />, color: netPnl >= 0 ? "text-emerald-600" : "text-red-500", bg: "bg-slate-50" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
            <div className={`h-9 w-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>{s.icon}</div>
            <p className={`text-xl font-bold ${s.color}`}>
              {s.label === "Net P&L" && netPnl > 0 ? "+" : ""}{formatCurrency(s.value)}
            </p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent trade activity */}
      {recentTrades.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Recent Trade Activity</h2>
            <Link href="/dashboard/trades" className="text-sm text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1">
              All trades <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-50">
              {recentTrades.map((t) => {
                const profit = t.profit ?? 0;
                const isProfit = profit >= 0;
                return (
                  <div key={t.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${t.position === "long" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                        {t.position === "long" ? "L" : "S"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{t.instrument.source}/{t.instrument.target}</p>
                        <p className="text-xs text-slate-400">{t.leverage}× · {formatDate(t.openingTime)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${isProfit ? "text-emerald-600" : "text-red-500"}`}>
                        {isProfit ? "+" : ""}{formatCurrency(profit)}
                      </p>
                      <p className="text-xs text-slate-400">{formatCurrency(t.margin)} margin</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Deposit / Withdrawal columns */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Deposits */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ArrowDownToLine className="h-4 w-4 text-emerald-500" /> Recent Deposits
            </h2>
            <Link href="/dashboard/transactions" className="text-xs text-slate-500 hover:text-slate-800">View all →</Link>
          </div>
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
            {deposits.length === 0 ? (
              <div className="py-10 text-center">
                <Wallet className="h-8 w-8 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">No deposits yet</p>
                <Link href="/dashboard/fund-account" className="text-xs text-orange-500 hover:text-orange-600 font-medium mt-1.5 inline-block">Make your first deposit →</Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {deposits.map((d) => (
                  <div key={d.id} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="text-sm font-bold text-emerald-600">{formatCurrency(d.amount)}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{d.paymentMethodTitle ?? "—"} · {formatDate(d.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusBadgeVariant(d.status)}>{d.status}</Badge>
                      <Link href={`/dashboard/transactions/${d.invoice}`} className="text-slate-300 hover:text-slate-700 transition-colors">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Withdrawals */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ArrowUpFromLine className="h-4 w-4 text-amber-500" /> Recent Withdrawals
            </h2>
            <Link href="/dashboard/transactions" className="text-xs text-slate-500 hover:text-slate-800">View all →</Link>
          </div>
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
            {withdrawals.length === 0 ? (
              <div className="py-10 text-center">
                <TrendingDown className="h-8 w-8 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">No withdrawals yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {withdrawals.map((w) => (
                  <div key={w.id} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="text-sm font-bold text-amber-600">{formatCurrency(w.amount)}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{w.paymentMethodTitle ?? "—"} · {formatDate(w.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusBadgeVariant(w.status)}>{w.status}</Badge>
                      <Link href={`/dashboard/transactions/${w.invoice}`} className="text-slate-300 hover:text-slate-700 transition-colors">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
