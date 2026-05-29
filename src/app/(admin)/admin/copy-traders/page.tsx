import { AdminTopbar } from "@/components/admin/topbar";
import { db } from "@/lib/db";
import { resolveStorageUrl } from "@/lib/storage";
import { AdminCopyTradersClient } from "./client";

interface PageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function AdminCopyTradersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const search = sp.search ?? "";
  const page = parseInt(sp.page ?? "1");
  const limit = 20;

  const where: any = {};
  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { user: { OR: [{ firstName: { contains: search } }, { email: { contains: search } }] } },
    ];
  }

  const [copyTraders, total, eligibleUsers] = await Promise.all([
    db.copyTrader.findMany({
      where, orderBy: { copiersCount: "desc" },
      skip: (page - 1) * limit, take: limit,
      select: {
        id: true, userId: true, sn: true, bio: true,
        firstName: true, lastName: true, country: true, gender: true, avatar: true,
        cumulativePnl: true, profitRate7d: true, profitRate30d: true, profitRate90d: true,
        maxDrawdown: true, profitShareRatio: true, accountInstruments: true,
        copiersCount: true, copiersEarnings: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true, username: true } },
      },
    }),
    db.copyTrader.count({ where }),
    db.user.findMany({
      where: { isCopyTrader: false },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: { firstName: "asc" }, take: 200,
    }),
  ]);

  const enriched = copyTraders.map((ct) => ({
    ...ct,
    traderFirstName: ct.firstName ?? null,
    traderLastName: ct.lastName ?? null,
    traderCountry: ct.country ?? null,
    traderGender: ct.gender ?? null,
    traderAvatar: resolveStorageUrl(ct.avatar, "traders"),
  }));

  return (
    <>
      <AdminTopbar title="Copy Traders" subtitle={`${total} copy traders`} />
      <AdminCopyTradersClient copyTraders={enriched as any} total={total} page={page} pages={Math.ceil(total / limit)} search={search} eligibleUsers={eligibleUsers} />
    </>
  );
}
