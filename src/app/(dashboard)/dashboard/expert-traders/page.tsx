import { auth } from "@/auth";
import { db } from "@/lib/db";
import { CopyTraderCard } from "@/components/dashboard/copy-trader-card";
import { Users, Search } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Expert Traders" };

const PER_PAGE = 20;

export default async function ExpertTradersPage({ searchParams }: { searchParams: Promise<{ sort?: string; page?: string; search?: string }> }) {
  const session = await auth();
  const params = await searchParams;
  const sort = params.sort ?? "profit30d";
  const page = Math.max(1, parseInt(params.page ?? "1"));
  const search = params.search ?? "";

  const orderBy =
    sort === "copiers"   ? { copiersCount: "desc" as const } :
    sort === "profit7d"  ? { profitRate7d: "desc" as const } :
    sort === "profit90d" ? { profitRate90d: "desc" as const } :
                           { profitRate30d: "desc" as const };

  const where = search
    ? { OR: [{ firstName: { contains: search } }, { lastName: { contains: search } }] }
    : undefined;

  const [traders, total] = await Promise.all([
    db.copyTrader.findMany({
      where,
      orderBy: [orderBy, { sn: "desc" }],
      take: PER_PAGE,
      skip: (page - 1) * PER_PAGE,
      select: {
        id: true, userId: true,
        firstName: true, lastName: true, avatar: true,
        profitRate7d: true, profitRate30d: true, profitRate90d: true,
        copiersCount: true, accountInstruments: true, cumulativePnl: true,
      },
    }),
    db.copyTrader.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  const sortLinks = [
    { key: "profit30d", label: "30D Profit" },
    { key: "profit7d",  label: "7D Profit" },
    { key: "profit90d", label: "90D Profit" },
    { key: "copiers",   label: "Most Copied" },
  ];

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    params.set("sort", sort);
    params.set("page", String(p));
    if (search) params.set("search", search);
    return `?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-black p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold mb-1">Expert Traders</h1>
            <p className="text-sm text-white/50">Browse and copy top-performing traders. Profits are mirrored automatically.</p>
          </div>
          <div className="shrink-0 flex items-center gap-2 text-sm text-white/60">
            <Users className="h-4 w-4" />
            {total} available
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form method="GET" className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input type="hidden" name="sort" value={sort} />
          <input name="search" defaultValue={search} placeholder="Search traders..." className="w-full h-9 pl-9 pr-4 text-sm bg-white border border-slate-200 rounded-full focus:outline-none focus:border-slate-400" />
        </form>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Sort by</span>
          {sortLinks.map((s) => (
            <a key={s.key} href={`?sort=${s.key}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                sort === s.key ? "bg-black text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}>
              {s.label}
            </a>
          ))}
        </div>
      </div>

      {traders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">{search ? `No traders matching "${search}"` : "No expert traders available yet"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {traders.map((t) => (
            <CopyTraderCard
              key={t.id}
              trader={{ ...t, firstName: t.firstName ?? "", lastName: t.lastName ?? "" }}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center gap-1 flex-wrap">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={pageUrl(p)}
              className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                p === page
                  ? "bg-black text-white border-black"
                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
