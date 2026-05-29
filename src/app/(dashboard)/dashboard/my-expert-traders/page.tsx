import { auth } from "@/auth";
import { db } from "@/lib/db";
import { CopyTraderCard } from "@/components/dashboard/copy-trader-card";
import Link from "next/link";
import { Users, ArrowRight } from "lucide-react";

export const metadata = { title: "My Copied Traders" };

export default async function MyExpertTradersPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const relations = await db.copyRelation.findMany({
    where: { copierId: userId },
    include: {
      copiedTrader: {
        select: {
          id: true,
          copyTrader: {
            select: {
              id: true, userId: true,
              firstName: true, lastName: true, avatar: true,
              profitRate30d: true, profitRate7d: true, profitRate90d: true,
              copiersCount: true, accountInstruments: true, cumulativePnl: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const traders = relations
    .map((r) => r.copiedTrader.copyTrader)
    .filter((ct): ct is NonNullable<typeof ct> => ct !== null);

  if (traders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center max-w-sm mx-auto">
        <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
          <Users className="h-8 w-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">No copied traders yet</h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">Browse expert traders and copy their strategies to start earning automatically.</p>
        <Link href="/dashboard/expert-traders" className="inline-flex items-center gap-2 rounded-xl bg-black text-white font-semibold px-5 py-2.5 text-sm hover:bg-orange-500 transition-colors">
          Browse Expert Traders <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-black p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold mb-1">My Copied Traders</h1>
            <p className="text-sm text-white/50">
              Copying <span className="text-white/80 font-semibold">{traders.length}</span> trader{traders.length !== 1 ? "s" : ""}. Trades mirror automatically.
            </p>
          </div>
          <Link href="/dashboard/expert-traders" className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 px-3.5 py-2 text-xs font-semibold transition-colors">
            Find more <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {traders.map((ct) => (
          <CopyTraderCard
            key={ct.id}
            trader={{ ...ct, firstName: ct.firstName ?? "", lastName: ct.lastName ?? "" }}
          />
        ))}
      </div>
    </div>
  );
}
