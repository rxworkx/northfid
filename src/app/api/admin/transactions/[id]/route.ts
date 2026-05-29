import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, unauthorized } from "../../_auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { id } = await params;
  const { status } = await req.json();

  const tx = await db.transaction.findUnique({ where: { id } });
  if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.transaction.update({
    where: { id },
    data: {
      status,
      confirmedAt: status === "confirmed" ? new Date() : tx.confirmedAt,
    },
  });

  // Update wallet on deposit confirm
  if (tx.type === "deposit" && status === "confirmed" && tx.status !== "confirmed") {
    await db.wallet.upsert({
      where: { userId: tx.userId },
      update: { balance: { increment: tx.amount } },
      create: { userId: tx.userId, balance: tx.amount },
    });
  }

  // Reverse wallet on deposit fail
  if (tx.type === "deposit" && status === "failed" && tx.status === "confirmed") {
    await db.wallet.update({
      where: { userId: tx.userId },
      data: { balance: { decrement: tx.amount } },
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { id } = await params;
  await db.transaction.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
