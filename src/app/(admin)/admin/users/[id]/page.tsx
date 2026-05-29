import { AdminTopbar } from "@/components/admin/topbar";
import { db } from "@/lib/db";
import { resolveStorageUrl } from "@/lib/storage";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { AdminUserDetailClient } from "./client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [user, session, mainAdmin] = await Promise.all([
    db.user.findUnique({
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
    }),
    auth(),
    db.user.findFirst({
      where: { role: "admin" },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    }),
  ]);

  if (!user) notFound();

  const resolvedUser = { ...user, image: resolveStorageUrl(user.image, "users") };
  const currentAdminId = session?.user?.id ?? "";
  const mainAdminId = mainAdmin?.id ?? "";

  return (
    <>
      <AdminTopbar title={`${user.firstName} ${user.lastName}`} subtitle={user.email} />
      <AdminUserDetailClient
        user={resolvedUser as any}
        currentAdminId={currentAdminId}
        mainAdminId={mainAdminId}
      />
    </>
  );
}
