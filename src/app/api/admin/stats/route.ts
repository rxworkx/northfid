import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, unauthorized } from "../_auth";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const [
    totalUsers,
    activeUsers,
    pendingKyc,
    pendingTransactions,
    totalDeposits,
    totalWithdrawals,
    totalTrades,
    openTrades,
    copyTraders,
    recentUsers,
    recentTransactions,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { status: "active" } }),
    db.kyc.count({ where: { status: "pending" } }),
    db.transaction.count({ where: { status: "pending" } }),
    db.transaction.aggregate({
      _sum: { amount: true },
      where: { type: "deposit", status: "confirmed" },
    }),
    db.transaction.aggregate({
      _sum: { amount: true },
      where: { type: "withdrawal", status: "confirmed" },
    }),
    db.trade.count(),
    db.trade.count({ where: { closingTime: null } }),
    db.copyTrader.count(),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, firstName: true, lastName: true, email: true, createdAt: true, status: true },
    }),
    db.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, invoice: true, type: true, amount: true, status: true, createdAt: true, user: { select: { firstName: true, lastName: true } } },
    }),
  ]);

  return NextResponse.json({
    totalUsers,
    activeUsers,
    pendingKyc,
    pendingTransactions,
    totalDeposits: totalDeposits._sum.amount ?? 0,
    totalWithdrawals: totalWithdrawals._sum.amount ?? 0,
    totalTrades,
    openTrades,
    copyTraders,
    recentUsers,
    recentTransactions,
  });
}
