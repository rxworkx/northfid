import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, unauthorized } from "../../_auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { id } = await params;
  const body = await req.json();
  const { closingPrice, closingTime, profit, position, leverage, openingPrice, margin } = body;

  const data: any = {};
  if (closingPrice !== undefined) data.closingPrice = parseFloat(closingPrice);
  if (closingTime !== undefined) data.closingTime = closingTime ? new Date(closingTime) : null;
  if (profit !== undefined) data.profit = parseFloat(profit);
  if (position !== undefined) data.position = position;
  if (leverage !== undefined) data.leverage = parseInt(leverage);
  if (openingPrice !== undefined) data.openingPrice = parseFloat(openingPrice);
  if (margin !== undefined) data.margin = parseFloat(margin);

  await db.trade.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { id } = await params;
  await db.trade.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
