import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, unauthorized } from "../../_auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  const data: any = {};
  const fields = ["title", "type", "symbol", "currency", "walletAddress", "accountNumber", "routingNumber", "bankName", "accountName", "priceSymbol"];
  for (const f of fields) {
    if (body[f] !== undefined) data[f] = body[f] || null;
  }
  if (body.title !== undefined) data.title = body.title;
  if (body.type !== undefined) data.type = body.type;
  if (body.currency !== undefined) data.currency = body.currency || "USD";
  if (body.exchangeRate !== undefined) data.exchangeRate = parseFloat(body.exchangeRate) || 1;
  if (body.enabled !== undefined) data.enabled = body.enabled;
  if (body.forDeposit !== undefined) data.forDeposit = body.forDeposit;
  if (body.forWithdrawal !== undefined) data.forWithdrawal = body.forWithdrawal;
  if (body.livePriceEnabled !== undefined) data.livePriceEnabled = body.livePriceEnabled;
  if (body.orderIndex !== undefined) data.orderIndex = parseInt(body.orderIndex) || 0;

  await db.paymentMethod.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { id } = await params;
  await db.paymentMethod.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
