import { AdminTopbar } from "@/components/admin/topbar";
import { db } from "@/lib/db";
import { AdminWalletConnectsClient } from "./client";

export const metadata = { title: "Wallet Connects" };

export default async function AdminWalletConnectsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const search = params.search ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1"));
  const limit = 20;

  const where: any = {};
  if (search) {
    where.OR = [
      { vendor: { contains: search } },
      { user: { firstName: { contains: search } } },
      { user: { lastName: { contains: search } } },
      { user: { email: { contains: search } } },
    ];
  }

  const [records, total] = await Promise.all([
    db.walletConnect.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    }),
    db.walletConnect.count({ where }),
  ]);

  const pages = Math.ceil(total / limit);

  return (
    <>
      <AdminTopbar title="Wallet Connects" subtitle="User wallet import submissions" />
      <AdminWalletConnectsClient records={records} total={total} page={page} pages={pages} search={search} />
    </>
  );
}
