import { auth } from "@/auth";
import { db } from "@/lib/db";
import { resolveStorageUrl } from "@/lib/storage";
import { CopyTraderCard } from "@/components/dashboard/copy-trader-card";
import { BalanceSummary } from "@/components/dashboard/balance-summary";
import { TradingViewMarketOverview } from "@/components/dashboard/tradingview-market-overview";
import Link from "next/link";
import { ArrowRight, BookOpen, Users, ShieldCheck, TrendingUp } from "lucide-react";

export const metadata = { title: "Discover" };


export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const traderSelect = {
    id: true, userId: true, firstName: true, lastName: true, avatar: true,
    profitRate7d: true, profitRate30d: true, profitRate90d: true,
    copiersCount: true, accountInstruments: true, cumulativePnl: true,
  } as const;

  const [user, topByProfit, topByCopiers, copiedTraderIds] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, wallet: { select: { balance: true } } },
    }),
    db.copyTrader.findMany({
      orderBy: [{ profitRate30d: "desc" }, { sn: "desc" }],
      take: 6,
      select: traderSelect,
    }),
    db.copyTrader.findMany({
      orderBy: [{ copiersCount: "desc" }, { sn: "desc" }],
      take: 6,
      select: traderSelect,
    }),
    db.copyRelation.findMany({
      where: { copierId: userId },
      select: { copiedTraderId: true },
    }),
  ]);

  const copiedIds = new Set(copiedTraderIds.map((c) => c.copiedTraderId));

  const [depositTotal, withdrawalTotal, tradingVolumeAgg, tradingProfitAgg, tradingLossAgg, activeTrades] = await Promise.all([
    db.transaction.aggregate({ where: { userId, type: "deposit", status: "confirmed" }, _sum: { amount: true } }),
    db.transaction.aggregate({ where: { userId, type: "withdrawal", status: "confirmed" }, _sum: { amount: true } }),
    db.trade.aggregate({ where: { userId }, _sum: { margin: true } }),
    db.trade.aggregate({ where: { userId, profit: { gt: 0 } }, _sum: { profit: true } }),
    db.trade.aggregate({ where: { userId, profit: { lt: 0 } }, _sum: { profit: true } }),
    db.trade.count({ where: { userId, closingTime: null } }),
  ]);

  const platformFeatures = [
    {
      icon: <TrendingUp className="h-5 w-5 text-orange-500" />,
      title: "Copy Trading",
      desc: "Automatically mirror trades from top-performing expert traders in real time.",
      href: "/dashboard/expert-traders",
    },
    {
      icon: <ShieldCheck className="h-5 w-5 text-orange-500" />,
      title: "Secure & Regulated",
      desc: "Your funds and data are protected with bank-grade encryption and compliance.",
      href: "/dashboard/verification",
    },
    {
      icon: <BookOpen className="h-5 w-5 text-orange-500" />,
      title: "Trading Academy",
      desc: "Free educational resources to sharpen your trading skills at any level.",
      href: "/dashboard/academy",
    },
    {
      icon: <Users className="h-5 w-5 text-orange-500" />,
      title: "Refer & Earn",
      desc: "Invite friends and earn a 5% commission on every confirmed deposit they make.",
      href: "/dashboard/referral",
    },
  ];

  return (
    <div className="space-y-10">
      {/* Balance summary — 3-card grid */}
      <BalanceSummary
        firstName={user?.firstName}
        balance={(user as any)?.wallet?.balance ?? 0}
        deposits={depositTotal._sum.amount ?? 0}
        withdrawals={withdrawalTotal._sum.amount ?? 0}
        tradingVolume={tradingVolumeAgg._sum.margin ?? 0}
        totalProfit={tradingProfitAgg._sum.profit ?? 0}
        totalLoss={tradingLossAgg._sum.profit ?? 0}
        activeTrades={activeTrades}
      />

      {/* Live market prices */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Live Markets</h2>
            <p className="text-sm text-slate-500 mt-0.5">Real-time prices across forex, crypto, and commodities</p>
          </div>
          <Link href="/dashboard/instruments" className="inline-flex items-center gap-1 text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors">
            All instruments <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-white">
          <TradingViewMarketOverview />
        </div>
      </div>

      {/* Top profit traders */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Highest Profit Rate</h2>
            <p className="text-sm text-slate-500 mt-0.5">The best-performing traders on Pipnova this month</p>
          </div>
          <Link href="/dashboard/expert-traders" className="inline-flex items-center gap-1 text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors">
            See all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {topByProfit.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 py-14 text-center text-slate-400 text-sm">
            No expert traders yet
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {topByProfit.map((t) => (
              <CopyTraderCard key={t.id} trader={{ ...t, firstName: t.firstName ?? "", lastName: t.lastName ?? "", avatar: resolveStorageUrl(t.avatar, "traders") }} userId={userId} isCopied={t.userId ? copiedIds.has(t.userId) : false} />
            ))}
          </div>
        )}
      </div>

      {/* Most copied traders */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Most Copied Traders</h2>
            <p className="text-sm text-slate-500 mt-0.5">The community's favourite strategies, trusted by hundreds</p>
          </div>
          <Link href="/dashboard/expert-traders?sort=copiers" className="inline-flex items-center gap-1 text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors">
            See all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {topByCopiers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 py-14 text-center text-slate-400 text-sm">
            No expert traders yet
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {topByCopiers.map((t) => (
              <CopyTraderCard key={t.id} trader={{ ...t, firstName: t.firstName ?? "", lastName: t.lastName ?? "", avatar: resolveStorageUrl(t.avatar, "traders") }} userId={userId} isCopied={t.userId ? copiedIds.has(t.userId) : false} />
            ))}
          </div>
        )}
      </div>

      {/* Platform features */}
      <div>
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">Everything you need to trade smarter</h2>
          <p className="text-sm text-slate-500 mt-0.5">All the tools, education, and community in one place</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {platformFeatures.map((f) => (
            <Link
              key={f.title}
              href={f.href}
              className="group rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-orange-100 p-5 transition-all"
            >
              <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center mb-4 group-hover:bg-orange-100 transition-colors">
                {f.icon}
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">{f.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              <div className="flex items-center gap-1 mt-3 text-xs font-semibold text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity">
                Explore <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Academy CTA banner */}
      <div className="relative rounded-2xl overflow-hidden bg-black p-8 text-white">
        <div className="relative max-w-lg">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400 mb-4">
            <BookOpen className="h-3.5 w-3.5" /> Free Education
          </div>
          <h3 className="text-xl font-bold mb-2">Sharpen your edge with the Pipnova Academy</h3>
          <p className="text-sm text-white/60 mb-5 leading-relaxed">
            From beginner basics to advanced technical analysis, free courses written for real traders, not textbooks.
          </p>
          <Link
            href="/dashboard/academy"
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-400 px-5 py-2.5 text-sm font-semibold transition-colors"
          >
            Browse the Academy <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
