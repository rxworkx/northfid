import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Activity } from "lucide-react";

export const metadata = { title: "My Trades" };

function shortDateTime(date: Date | string) {
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(2);
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yy} ${hh}:${min}`;
}

type TradeTab = "all" | "open" | "closed";

export default async function TradesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const session = await auth();
  const userId = session!.user!.id!;
  const params = await searchParams;
  const tab = (["all", "open", "closed"].includes(params.tab ?? "") ? params.tab : "all") as TradeTab;
  const page = Math.max(1, parseInt(params.page ?? "1"));
  const perPage = 20;
  const now = new Date();

  const where =
    tab === "open"
      ? { userId, closingTime: { gt: now }, profitTaken: false }
      : tab === "closed"
      ? { userId, OR: [{ closingTime: { lte: now } }, { profitTaken: true }] }
      : { userId };

  const [trades, total] = await Promise.all([
    db.trade.findMany({
      where,
      orderBy: { openingTime: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: { copiedFrom: { select: { firstName: true, lastName: true } } },
    }),
    db.trade.count({ where }),
  ]);

  const totalPages = Math.ceil(total / perPage);

  const tabs: { key: TradeTab; label: string }[] = [
    { key: "all",    label: "All" },
    { key: "open",   label: "Open" },
    { key: "closed", label: "Closed" },
  ];

  return (
    <div className="max-w-2xl space-y-0 -mt-2">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit mb-6">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`?tab=${t.key}`}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
              tab === t.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {trades.length === 0 ? (
        <div className="rounded-xl bg-white border border-slate-100 py-16 text-center">
          <Activity className="h-8 w-8 text-slate-200 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">No trades found</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {trades.map((trade) => {
              const profit = trade.profit ?? null;
              const isProfit = profit !== null && profit >= 0;
              const isLong = trade.position === "long";
              const isClosed =
                trade.profitTaken ||
                (trade.closingTime !== null && new Date(trade.closingTime) <= now);

              return (
                <div
                  key={trade.id}
                  className="bg-white rounded-lg overflow-hidden"
                >
                  {/* Coloured top strip */}
                  <div
                    className={`h-1 w-full ${
                      profit !== null
                        ? isProfit
                          ? "bg-emerald-400"
                          : "bg-red-400"
                        : isLong
                        ? "bg-emerald-300"
                        : "bg-red-300"
                    }`}
                  />

                  <div className="px-4 py-3">
                    {/* Row 1: position + instrument + leverage / profit */}
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <span
                          className={`font-medium ${
                            isLong ? "text-emerald-600" : "text-red-500"
                          }`}
                        >
                          {isLong ? "▲ Long" : "▼ Short"}
                        </span>{" "}
                        <span className="font-semibold text-slate-800">
                          {trade.sourceSymbol}/{trade.targetSymbol} {trade.leverage}×
                        </span>
                        <div className="text-slate-400 text-sm mt-0.5 flex items-center gap-1">
                          <span>
                            {trade.openingPrice.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 5,
                            })}
                          </span>
                          <ArrowRight className="h-3 w-3 shrink-0" />
                          {trade.closingPrice !== null ? (
                            <span>
                              {trade.closingPrice.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 5,
                              })}
                            </span>
                          ) : (
                            <span className="italic">pending</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right mt-0.5">
                        {profit !== null ? (
                          <span
                            className={`font-semibold ${
                              isProfit ? "text-emerald-600" : "text-red-500"
                            }`}
                          >
                            {isProfit ? "+" : ""}
                            {formatCurrency(profit)}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-semibold">—</span>
                        )}
                      </div>
                    </div>

                    {/* Row 2: timestamps / margin (left) | copy trader (right) */}
                    <div className="text-xs text-slate-400 flex items-center justify-between gap-x-3 mt-1">
                      <div className="flex items-center gap-x-3 flex-wrap gap-y-0.5">
                        <span className="flex items-center gap-1">
                          {shortDateTime(trade.openingTime)}
                          {isClosed && trade.closingTime ? (
                            <>
                              <ArrowRight className="h-3 w-3 shrink-0" />
                              {shortDateTime(trade.closingTime)}
                            </>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-500 font-medium ml-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Live
                            </span>
                          )}
                        </span>
                        <span>Margin: {formatCurrency(trade.margin)}</span>
                      </div>
                      {trade.copiedFrom && (
                        <span className="shrink-0">
                          via{" "}
                          <span className="font-medium text-slate-500">
                            {trade.copiedFrom.firstName} {trade.copiedFrom.lastName}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1 pt-4 flex-wrap">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`?tab=${tab}&page=${p}`}
                  className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                    p === page
                      ? "bg-slate-700 text-white border-slate-700"
                      : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
