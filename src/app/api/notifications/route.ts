import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    // notification model may not be in the generated Prisma client until next server restart
    const dbNotifs: any[] = await (db as any).notification
      ?.findMany({ where: { userId, delivery: { not: "email" } }, orderBy: { createdAt: "desc" }, take: 10 })
      .catch(() => []) ?? [];

    const [transactions, trades] = await Promise.all([
      db.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, type: true, amount: true, status: true, createdAt: true },
      }).catch(() => [] as any[]),
      db.trade.findMany({
        where: { userId, closingTime: { not: null } },
        orderBy: { closingTime: "desc" },
        take: 4,
        select: { id: true, sourceSymbol: true, targetSymbol: true, profit: true, closingTime: true, position: true },
      }).catch(() => [] as any[]),
    ]);

    const items = [
      ...dbNotifs.map((n: any) => ({
        id: `notif-${n.id}`,
        type: n.type,
        title: n.title,
        description: n.body,
        status: n.type === "new_login" ? "warning" : "info",
        time: n.createdAt.toISOString(),
        href: n.href,
        read: n.read,
      })),
      ...transactions.map((t) => ({
        id: `tx-${t.id}`,
        type: t.type as string,
        title:
          t.type === "deposit"
            ? t.status === "confirmed" ? "Deposit confirmed" : t.status === "failed" ? "Deposit failed" : "Deposit pending"
            : t.type === "withdrawal"
            ? t.status === "confirmed" ? "Withdrawal processed" : t.status === "failed" ? "Withdrawal failed" : "Withdrawal requested"
            : "Transaction",
        description: `$${t.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        status: t.status,
        time: t.createdAt.toISOString(),
        href: "/dashboard/transactions",
        read: true,
      })),
      ...trades.map((t) => ({
        id: `trade-${t.id}`,
        type: "trade_closed",
        title: `${t.sourceSymbol}/${t.targetSymbol} closed`,
        description:
          t.profit != null
            ? t.profit >= 0
              ? `+$${t.profit.toFixed(2)} profit`
              : `-$${Math.abs(t.profit).toFixed(2)} loss`
            : t.position,
        status: t.profit != null && t.profit >= 0 ? "profit" : "loss",
        time: t.closingTime!.toISOString(),
        href: "/dashboard/trades",
        read: true,
      })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 15);

    const unreadCount = items.filter((i) => !i.read).length;

    return NextResponse.json({ notifications: items, unreadCount });
  } catch (err) {
    console.error("[NOTIFICATIONS GET]", err);
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }
}

// Mark all DB notifications as read
export async function PATCH() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await (db as any).notification
      ?.updateMany({ where: { userId: session.user.id, read: false }, data: { read: true } })
      .catch(() => {});
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
