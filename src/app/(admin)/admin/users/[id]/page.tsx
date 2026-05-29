import { AdminTopbar } from "@/components/admin/topbar";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { AdminUserDetailClient } from "./client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { id } = await params;

  const user = await db.user.findUnique({
    where: { id },
    include: {
      wallet: true,
      kyc: true,
      copyTrader: true,
      transactions: { orderBy: { createdAt: "desc" }, take: 10 },
      trades: {
        orderBy: { createdAt: "desc" }, take: 10,
        include: { instrument: { select: { source: true, target: true } } },
      },
      loginSessions: { orderBy: { createdAt: "desc" }, take: 5 },
      _count: { select: { transactions: true, trades: true, referrals: true } },
    },
  });

  if (!user) notFound();

  return (
    <>
      <AdminTopbar title={`${user.firstName} ${user.lastName}`} subtitle={user.email} />
      <AdminUserDetailClient user={user as any} />
    </>
  );
}
