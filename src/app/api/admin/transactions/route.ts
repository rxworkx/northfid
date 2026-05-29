import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, unauthorized } from "../_auth";
import { generateInvoiceNumber } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const type = searchParams.get("type") ?? "";
  const status = searchParams.get("status") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;

  const where: any = {};
  if (type) where.type = type;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { invoice: { contains: search, mode: "insensitive" } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { user: { username: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [transactions, total] = await Promise.all([
    db.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    }),
    db.transaction.count({ where }),
  ]);

  return NextResponse.json({ transactions, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const body = await req.json();
  const { userId, type, amount, status, paymentMethodId, notes } = body;

  if (!userId || !type || !amount) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
  }

  let pmType: string | null = null;
  let pmTitle: string | null = null;
  if (paymentMethodId) {
    const pm = await db.paymentMethod.findUnique({ where: { id: paymentMethodId }, select: { type: true, title: true } });
    if (pm) { pmType = pm.type; pmTitle = pm.title; }
  }

  const tx = await db.transaction.create({
    data: {
      userId,
      type,
      invoice: generateInvoiceNumber(),
      amount: parseFloat(amount),
      status: status || "confirmed",
      paymentMethodType: pmType,
      paymentMethodTitle: pmTitle,
      confirmedAt: status === "confirmed" ? new Date() : null,
    },
  });

  const resolvedStatus = status || "confirmed";

  // If confirmed deposit, credit wallet
  if (type === "deposit" && resolvedStatus === "confirmed") {
    await db.wallet.upsert({
      where: { userId },
      update: { balance: { increment: parseFloat(amount) } },
      create: { userId, balance: parseFloat(amount) },
    });
  }

  // If confirmed withdrawal, deduct wallet
  if (type === "withdrawal" && resolvedStatus === "confirmed") {
    await db.wallet.update({
      where: { userId },
      data: { balance: { decrement: parseFloat(amount) } },
    });
  }

  return NextResponse.json({ id: tx.id }, { status: 201 });
}
