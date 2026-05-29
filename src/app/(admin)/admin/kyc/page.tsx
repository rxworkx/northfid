import { AdminTopbar } from "@/components/admin/topbar";
import { db } from "@/lib/db";
import { AdminKycClient } from "./client";

interface PageProps {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}

export default async function AdminKycPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const status = sp.status ?? "pending";
  const search = sp.search ?? "";
  const page = parseInt(sp.page ?? "1");
  const limit = 20;

  const where: any = {};
  if (status) where.status = status;
  if (search) {
    where.user = {
      OR: [
        { email: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ],
    };
  }

  const [kycs, total, counts] = await Promise.all([
    db.kyc.findMany({
      where, orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit, take: limit,
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, username: true } } },
    }),
    db.kyc.count({ where }),
    Promise.all([
      db.kyc.count({ where: { status: "pending" } }),
      db.kyc.count({ where: { status: "approved" } }),
      db.kyc.count({ where: { status: "rejected" } }),
    ]),
  ]);

  return (
    <>
      <AdminTopbar title="KYC Verification" subtitle="Review identity submissions" />
      <AdminKycClient kycs={kycs as any} total={total} page={page} pages={Math.ceil(total / limit)} currentStatus={status} search={search}
        counts={{ pending: counts[0], approved: counts[1], rejected: counts[2] }} />
    </>
  );
}
