import { AdminTopbar } from "@/components/admin/topbar";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  Users, ArrowDownToLine, ArrowUpFromLine, Activity,
  BadgeCheck, Clock, TrendingUp, Copy, AlertTriangle,
} from "lucide-react";

async function getStats() {
  const [
    totalUsers, activeUsers, pendingKyc, pendingTx, totalDeposits, totalWithdrawals,
    totalTrades, openTrades, copyTraders, recentUsers, recentTransactions,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { status: "active" } }),
    db.kyc.count({ where: { status: "pending" } }),
    db.transaction.count({ where: { status: "pending", type: { in: ["deposit", "withdrawal"] } } }),
    db.transaction.aggregate({ _sum: { amount: true }, where: { type: "deposit", status: "confirmed" } }),
    db.transaction.aggregate({ _sum: { amount: true }, where: { type: "withdrawal", status: "confirmed" } }),
    db.trade.count(),
    db.trade.count({ where: { closingTime: null } }),
    db.copyTrader.count(),
    db.user.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, firstName: true, lastName: true, email: true, createdAt: true, status: true } }),
    db.transaction.findMany({
      orderBy: { createdAt: "desc" }, take: 6,
      select: { id: true, invoice: true, type: true, amount: true, status: true, createdAt: true, user: { select: { firstName: true, lastName: true } } },
    }),
  ]);
  return { totalUsers, activeUsers, pendingKyc, pendingTx, totalDeposits: totalDeposits._sum.amount ?? 0, totalWithdrawals: totalWithdrawals._sum.amount ?? 0, totalTrades, openTrades, copyTraders, recentUsers, recentTransactions };
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
  active: "bg-emerald-100 text-emerald-700",
  suspended: "bg-amber-100 text-amber-700",
  banned: "bg-red-100 text-red-700",
};

const TX_TYPE_COLORS: Record<string, string> = {
  deposit: "text-emerald-600",
  withdrawal: "text-red-500",
  trade_profit: "text-slate-600",
  referral: "text-purple-600",
};

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    { label: "Total Users", value: stats.totalUsers.toLocaleString(), sub: `${stats.activeUsers} active`, icon: <Users className="h-5 w-5" />, iconCls: "bg-black text-white", href: "/admin/users" },
    { label: "Total Deposits", value: formatCurrency(stats.totalDeposits), sub: `${stats.pendingTx} pending`, icon: <ArrowDownToLine className="h-5 w-5" />, iconCls: "bg-emerald-50 text-emerald-600", href: "/admin/transactions?type=deposit" },
    { label: "Total Withdrawals", value: formatCurrency(stats.totalWithdrawals), sub: "confirmed only", icon: <ArrowUpFromLine className="h-5 w-5" />, iconCls: "bg-red-50 text-red-500", href: "/admin/transactions?type=withdrawal" },
    { label: "Total Trades", value: stats.totalTrades.toLocaleString(), sub: `${stats.openTrades} open`, icon: <Activity className="h-5 w-5" />, iconCls: "bg-black text-white", href: "/admin/trades" },
    { label: "Copy Traders", value: stats.copyTraders.toLocaleString(), sub: "active traders", icon: <Copy className="h-5 w-5" />, iconCls: "bg-slate-100 text-slate-600", href: "/admin/copy-traders" },
    { label: "KYC Pending", value: stats.pendingKyc.toLocaleString(), sub: "awaiting review", icon: <BadgeCheck className="h-5 w-5" />, iconCls: "bg-slate-100 text-slate-600", href: "/admin/kyc?status=pending" },
  ];

  return (
    <>
      <AdminTopbar title="Dashboard" subtitle="Platform overview" />
      <main className="flex-1 p-6 space-y-6">

        {/* Alert banners */}
        {(stats.pendingKyc > 0 || stats.pendingTx > 0) && (
          <div className="flex flex-wrap gap-3">
            {stats.pendingTx > 0 && (
              <Link href="/admin/transactions?status=pending" className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium hover:bg-amber-100 transition-colors">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                {stats.pendingTx} pending transaction{stats.pendingTx !== 1 ? "s" : ""} need attention
              </Link>
            )}
            {stats.pendingKyc > 0 && (
              <Link href="/admin/kyc?status=pending" className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm font-medium hover:bg-slate-100 transition-colors">
                <BadgeCheck className="h-4 w-4 text-slate-500" />
                {stats.pendingKyc} KYC submission{stats.pendingKyc !== 1 ? "s" : ""} awaiting review
              </Link>
            )}
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <Link key={card.label} href={card.href} className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${card.iconCls}`}>
                  {card.icon}
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mb-0.5">{card.value}</p>
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
            </Link>
          ))}
        </div>

        {/* Tables Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="bg-white rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Recent Users</h2>
              <Link href="/admin/users" className="text-xs text-slate-500 font-medium hover:text-slate-900 transition-colors">View all →</Link>
            </div>
            <div className="divide-y divide-slate-50">
              {stats.recentUsers.map((u) => (
                <Link key={u.id} href={`/admin/users/${u.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-black flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {u.firstName[0]}{u.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[u.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {u.status}
                    </span>
                    <span className="text-[10px] text-slate-400">{formatDate(u.createdAt)}</span>
                  </div>
                </Link>
              ))}
              {stats.recentUsers.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">No users yet</p>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Recent Transactions</h2>
              <Link href="/admin/transactions" className="text-xs text-slate-500 font-medium hover:text-slate-900 transition-colors">View all →</Link>
            </div>
            <div className="divide-y divide-slate-50">
              {stats.recentTransactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{tx.user.firstName} {tx.user.lastName}</p>
                    <p className="text-xs text-slate-400 truncate">{tx.invoice}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-sm font-semibold ${TX_TYPE_COLORS[tx.type] ?? "text-slate-600"}`}>
                      {tx.type === "withdrawal" ? "-" : "+"}{formatCurrency(tx.amount)}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[tx.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
              {stats.recentTransactions.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">No transactions yet</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
