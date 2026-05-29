import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/dashboard/copy-button";
import Link from "next/link";
import { ArrowLeft, Users, TrendingUp, BarChart2, Shield } from "lucide-react";

export default async function TraderProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session!.user!.id!;
  const { id } = await params;

  const ct = await db.copyTrader.findUnique({
    where: { id },
    select: {
      id: true, userId: true,
      firstName: true, lastName: true, country: true, bio: true, avatar: true,
      profitRate7d: true, profitRate30d: true, profitRate90d: true,
      copiersCount: true, accountInstruments: true, cumulativePnl: true,
      maxDrawdown: true, profitShareRatio: true, copiersEarnings: true,
      user: { select: { platformDate: true } },
    },
  });

  if (!ct) notFound();

  const isCopied = ct.userId
    ? !!(await db.copyRelation.findUnique({
        where: { copierId_copiedTraderId: { copierId: userId, copiedTraderId: ct.userId } },
      }))
    : false;

  const firstName = ct.firstName ?? "";
  const lastName = ct.lastName ?? "";

  const avatarUrl = !ct.avatar
    ? `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(firstName + " " + lastName)}&backgroundColor=2a2a2a&textColor=ffffff`
    : `/uploads/traders/${ct.avatar}`;

  const stats = [
    { label: "Cumulative PnL",    value: formatCurrency(ct.cumulativePnl),             icon: <TrendingUp className="h-4 w-4 text-slate-700" />,   positive: ct.cumulativePnl >= 0 },
    { label: "30D Profit Rate",   value: `${ct.profitRate30d >= 0 ? "+" : ""}${ct.profitRate30d.toFixed(1)}%`,   icon: <BarChart2 className="h-4 w-4 text-emerald-600" />, positive: ct.profitRate30d >= 0 },
    { label: "7D Profit Rate",    value: `${ct.profitRate7d >= 0 ? "+" : ""}${ct.profitRate7d.toFixed(1)}%`,    icon: <BarChart2 className="h-4 w-4 text-emerald-600" />, positive: ct.profitRate7d >= 0 },
    { label: "90D Profit Rate",   value: `${ct.profitRate90d >= 0 ? "+" : ""}${ct.profitRate90d.toFixed(1)}%`,  icon: <BarChart2 className="h-4 w-4 text-emerald-600" />, positive: ct.profitRate90d >= 0 },
    { label: "Max Drawdown",      value: `${ct.maxDrawdown.toFixed(1)}%`,               icon: <Shield className="h-4 w-4 text-amber-600" />,       positive: false },
    { label: "Total Copiers",     value: ct.copiersCount.toString(),                    icon: <Users className="h-4 w-4 text-purple-600" />,       positive: true },
    { label: "Copiers Earnings",  value: formatCurrency(ct.copiersEarnings),            icon: <TrendingUp className="h-4 w-4 text-slate-700" />,   positive: ct.copiersEarnings >= 0 },
    { label: "Profit Share",      value: `${ct.profitShareRatio.toFixed(1)}%`,          icon: <BarChart2 className="h-4 w-4 text-indigo-600" />,   positive: true },
    { label: "Instruments",       value: ct.accountInstruments.toString(),              icon: <BarChart2 className="h-4 w-4 text-slate-600" />,    positive: true },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/dashboard/expert-traders" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Expert Traders
      </Link>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <img src={avatarUrl} alt={firstName} className="h-20 w-20 rounded-2xl object-cover border-2 border-slate-200 shrink-0" />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-slate-900">{firstName} {lastName}</h1>
              {ct.country && <p className="text-sm text-slate-500 mt-0.5">{ct.country}</p>}
              {ct.bio && <p className="text-sm text-slate-700 mt-3 leading-relaxed">{ct.bio}</p>}
              {ct.userId && (
                <div className="mt-4">
                  <CopyButton traderId={ct.userId} userId={userId} isCopied={isCopied} />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Performance Statistics</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <div className="flex items-center gap-2 mb-2">{s.icon}<span className="text-xs text-slate-500">{s.label}</span></div>
                <p className={`text-lg font-bold ${s.label.includes("Drawdown") ? "text-amber-600" : s.positive ? "text-emerald-700" : "text-red-600"}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
