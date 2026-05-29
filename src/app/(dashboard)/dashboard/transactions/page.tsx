import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Badge, statusBadgeVariant } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine, TrendingUp, Gift, ExternalLink, Receipt } from "lucide-react";

export const metadata = { title: "Transactions" };

const typeConfig = {
  deposit:     { label: "Deposit",       icon: <ArrowDownToLine className="h-4 w-4" />, dot: "bg-emerald-400", amount: "text-emerald-600", sign: "+" },
  withdrawal:  { label: "Withdrawal",    icon: <ArrowUpFromLine  className="h-4 w-4" />, dot: "bg-amber-400",   amount: "text-red-500",     sign: "−" },
  trade_profit:{ label: "Trade Profit",  icon: <TrendingUp       className="h-4 w-4" />, dot: "bg-blue-400",    amount: "text-slate-700",   sign: "+" },
  referral:    { label: "Referral Bonus",icon: <Gift             className="h-4 w-4" />, dot: "bg-purple-400",  amount: "text-purple-600",  sign: "+" },
};

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<{ page?: string; type?: string }> }) {
  const session = await auth();
  const userId = session!.user!.id!;
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1"));
  const typeFilter = params.type;
  const perPage = 20;

  const where = { userId, ...(typeFilter ? { type: typeFilter } : {}) };

  const [transactions, total, summary] = await Promise.all([
    db.transaction.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * perPage, take: perPage }),
    db.transaction.count({ where }),
    db.transaction.groupBy({ by: ["type"], where: { userId }, _count: true, _sum: { amount: true } }),
  ]);

  const totalPages = Math.ceil(total / perPage);
  const filterTypes = ["deposit", "withdrawal", "trade_profit", "referral"];

  return (
    <div className="max-w-4xl space-y-6">
      {/* Summary pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {filterTypes.map((type) => {
          const cfg = typeConfig[type as keyof typeof typeConfig];
          const stat = summary.find((s) => s.type === type);
          const isActive = typeFilter === type;
          return (
            <Link
              key={type}
              href={isActive ? "/dashboard/transactions" : `?type=${type}`}
              className={`rounded-xl border p-4 transition-all shadow-sm ${
                isActive
                  ? "border-orange-200 bg-orange-50"
                  : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-md"
              }`}
            >
              <div className={`flex items-center gap-1.5 text-xs font-semibold mb-2 ${isActive ? "text-orange-600" : "text-slate-500"}`}>
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </div>
              <p className={`text-lg font-bold ${isActive ? "text-orange-700" : "text-slate-800"}`}>
                {formatCurrency(stat?._sum?.amount ?? 0)}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{stat?._count ?? 0} transaction{(stat?._count ?? 0) !== 1 ? "s" : ""}</p>
            </Link>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
          <h2 className="text-sm font-bold text-slate-900">
            {typeFilter ? typeConfig[typeFilter as keyof typeof typeConfig]?.label + "s" : "All Transactions"}
          </h2>
          <span className="text-xs text-slate-400">{total} total</span>
        </div>

        {transactions.length === 0 ? (
          <div className="py-16 text-center">
            <Receipt className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No transactions yet</p>
            <Link href="/dashboard/fund-account" className="mt-2 inline-block text-sm text-orange-500 hover:text-orange-600 font-medium">
              Make your first deposit →
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Type</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Amount</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide hidden sm:table-cell">Method</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide hidden md:table-cell">Date</th>
                    <th className="px-5 py-3 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => {
                    const cfg = typeConfig[t.type as keyof typeof typeConfig] ?? typeConfig.deposit;
                    return (
                      <tr key={t.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-white ${
                              t.type === "deposit" ? "bg-emerald-100 text-emerald-600" :
                              t.type === "withdrawal" ? "bg-amber-100 text-amber-600" :
                              t.type === "referral" ? "bg-purple-100 text-purple-600" :
                              "bg-slate-100 text-slate-600"
                            }`}>
                              {cfg.icon}
                            </div>
                            <span className="font-medium text-slate-800">{cfg.label}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`font-bold ${cfg.amount}`}>
                            {cfg.sign}{formatCurrency(t.amount)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-500 text-xs hidden sm:table-cell">{t.paymentMethodTitle ?? "—"}</td>
                        <td className="px-5 py-4">
                          <Badge variant={statusBadgeVariant(t.status)}>{t.status}</Badge>
                        </td>
                        <td className="px-5 py-4 text-slate-400 text-xs whitespace-nowrap hidden md:table-cell">{formatDateTime(t.createdAt)}</td>
                        <td className="px-5 py-4 text-right">
                          <Link href={`/dashboard/transactions/${t.invoice}`} className="text-slate-300 hover:text-slate-700 transition-colors">
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-slate-50">
                <p className="text-xs text-slate-400">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link href={`?${typeFilter ? `type=${typeFilter}&` : ""}page=${page - 1}`} className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">Previous</Link>
                  )}
                  {page < totalPages && (
                    <Link href={`?${typeFilter ? `type=${typeFilter}&` : ""}page=${page + 1}`} className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">Next</Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
