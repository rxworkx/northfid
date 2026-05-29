import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, unauthorized } from "../../_auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { id } = await params;
  const body = await req.json();
  const { source, target, tradingViewSymbol, priceSymbol, enabled, livePriceEnabled, bidPrice, askPrice } = body;

  const data: any = {};
  if (source !== undefined) data.source = source.toUpperCase();
  if (target !== undefined) data.target = target.toUpperCase();
  if (tradingViewSymbol !== undefined) data.tradingViewSymbol = tradingViewSymbol || null;
  if (priceSymbol !== undefined) data.priceSymbol = priceSymbol || null;
  if (enabled !== undefined) data.enabled = enabled;
  if (livePriceEnabled !== undefined) data.livePriceEnabled = livePriceEnabled;
  if (bidPrice !== undefined) data.bidPrice = parseFloat(bidPrice) || null;
  if (askPrice !== undefined) data.askPrice = parseFloat(askPrice) || null;

  await db.instrument.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { id } = await params;
  await db.instrument.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
