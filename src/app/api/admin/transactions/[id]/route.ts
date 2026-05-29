import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, unauthorized } from "../../_auth";

async function adjustBalance(userId: string, delta: number) {
  const wallet = await db.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    console.error(`[tx-confirm] wallet not found for userId=${userId}`);
    return;
  }
  const newBalance = wallet.balance + delta;
  await db.wallet.update({ where: { userId }, data: { balance: newBalance } });
  console.log(`[tx-confirm] wallet ${userId}: ${wallet.balance} → ${newBalance} (delta ${delta})`);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { id } = await params;
  const { status } = await req.json();

  const tx = await db.transaction.findUnique({ where: { id } });
  if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  console.log(`[tx-confirm] id=${id} type=${tx.type} ${tx.status} → ${status} amount=${tx.amount}`);

  await db.transaction.update({
    where: { id },
    data: { status, confirmedAt: status === "confirmed" ? new Date() : tx.confirmedAt },
  });

  const isBalanceDeposit = tx.type === "deposit" && tx.paymentMethodType === "balance";

  try {
    if (tx.type === "deposit" && !isBalanceDeposit && status === "confirmed" && tx.status !== "confirmed") {
      const wallet = await db.wallet.findUnique({ where: { userId: tx.userId } });
      if (wallet) {
        await db.wallet.update({ where: { userId: tx.userId }, data: { balance: wallet.balance + tx.amount } });
        console.log(`[tx-confirm] deposit +${tx.amount} → new balance ${wallet.balance + tx.amount}`);
      } else {
        await db.wallet.create({ data: { userId: tx.userId, balance: tx.amount } });
        console.log(`[tx-confirm] deposit: created wallet with ${tx.amount}`);
      }
    }

    if (tx.type === "deposit" && !isBalanceDeposit && status === "failed" && tx.status === "confirmed") {
      await adjustBalance(tx.userId, -tx.amount);
    }

    if (isBalanceDeposit && status === "failed" && tx.status !== "failed") {
      await adjustBalance(tx.userId, tx.amount);
    }

    if (tx.type === "withdrawal" && status === "confirmed" && tx.status !== "confirmed") {
      await adjustBalance(tx.userId, -tx.amount);
    }

    if (tx.type === "withdrawal" && status === "failed" && tx.status === "confirmed") {
      await adjustBalance(tx.userId, tx.amount);
    }
  } catch (e) {
    console.error("[tx-confirm] wallet update failed:", e);
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
