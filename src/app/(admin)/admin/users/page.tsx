import { AdminTopbar } from "@/components/admin/topbar";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { AdminUsersClient } from "./client";

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const search = sp.search ?? "";
  const status = sp.status ?? "";
  const page = parseInt(sp.page ?? "1");
  const limit = 20;

  const where: any = {};
  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { email: { contains: search } },
      { username: { contains: search } },
    ];
  }
  if (status) where.status = status;

  const [users, total] = await Promise.all([
    db.user.findMany({
      where, orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit, take: limit,
      select: {
        id: true, firstName: true, lastName: true, username: true,
        email: true, phone: true, country: true, status: true, role: true,
        emailVerified: true, isCopyTrader: true, mustResetPassword: true, createdAt: true,
        wallet: { select: { balance: true } },
        kyc: { select: { status: true } },
      },
    }),
    db.user.count({ where }),
  ]);

  const usersWithRole = users;

  const pages = Math.ceil(total / limit);

  return (
    <>
      <AdminTopbar title="Users" subtitle={`${total} total users`} />
      <AdminUsersClient users={usersWithRole as any} total={total} page={page} pages={pages} search={search} status={status} />
    </>
  );
}
