import { AdminTopbar } from "@/components/admin/topbar";
import { db } from "@/lib/db";
import { AdminTransactionsClient } from "./client";

interface PageProps {
  searchParams: Promise<{ search?: string; type?: string; status?: string; page?: string }>;
}

export default async function AdminTransactionsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const search = sp.search ?? "";
  const type = sp.type ?? "";
  const status = sp.status ?? "";
  const page = parseInt(sp.page ?? "1");
  const limit = 20;

  const where: any = {};
  if (type) where.type = type;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { invoice: { contains: search } },
      { user: { email: { contains: search } } },
      { user: { username: { contains: search } } },
    ];
  }

  const [transactions, total, users, paymentMethods] = await Promise.all([
    db.transaction.findMany({
      where, orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit, take: limit,
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    }),
    db.transaction.count({ where }),
    db.user.findMany({ select: { id: true, firstName: true, lastName: true, email: true }, orderBy: { firstName: "asc" }, take: 100 }),
    db.paymentMethod.findMany({ select: { id: true, title: true, type: true, symbol: true }, orderBy: { title: "asc" } }),
  ]);

  return (
    <>
      <AdminTopbar title="Transactions" subtitle={`${total} transactions`} />
      <AdminTransactionsClient transactions={transactions as any} total={total} page={page} pages={Math.ceil(total / limit)} search={search} type={type} status={status} users={users} paymentMethods={paymentMethods} />
    </>
  );
}
