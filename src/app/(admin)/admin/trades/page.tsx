import { AdminTopbar } from "@/components/admin/topbar";
import { db } from "@/lib/db";
import { AdminTradesClient } from "./client";

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}

export default async function AdminTradesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const search = sp.search ?? "";
  const status = sp.status ?? "";
  const page = parseInt(sp.page ?? "1");
  const limit = 20;

  const where: any = {};
  if (status === "open") where.closingTime = null;
  if (status === "closed") where.NOT = { closingTime: null };
  if (search) {
    where.OR = [
      { sourceSymbol: { contains: search } },
      { targetSymbol: { contains: search } },
      { user: { firstName: { contains: search } } },
      { user: { lastName: { contains: search } } },
      { user: { email: { contains: search } } },
    ];
  }

  const [trades, total, instruments, users] = await Promise.all([
    db.trade.findMany({
      where, orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit, take: limit,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        instrument: { select: { source: true, target: true } },
      },
    }),
    db.trade.count({ where }),
    db.instrument.findMany({ where: { enabled: true }, select: { id: true, source: true, target: true }, orderBy: { source: "asc" }, take: 200 }),
    db.user.findMany({ select: { id: true, firstName: true, lastName: true, email: true }, orderBy: { firstName: "asc" }, take: 100 }),
  ]);

  return (
    <>
      <AdminTopbar title="Trades" subtitle={`${total} trades total`} />
      <AdminTradesClient trades={trades as any} total={total} page={page} pages={Math.ceil(total / limit)} search={search} status={status} instruments={instruments} users={users} />
    </>
  );
}
