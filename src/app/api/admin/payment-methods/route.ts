import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, unauthorized } from "../_auth";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const methods = await db.paymentMethod.findMany({ orderBy: { orderIndex: "asc" } });
  return NextResponse.json(methods);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const body = await req.json();
  const { title, type, symbol, currency, exchangeRate, walletAddress, accountNumber, routingNumber, bankName, accountName, enabled, forDeposit, forWithdrawal, livePriceEnabled, priceSymbol, orderIndex } = body;

  if (!title || !type) return NextResponse.json({ error: "title and type required" }, { status: 400 });

  const method = await db.paymentMethod.create({
    data: {
      title,
      type,
      symbol: symbol || null,
      currency: currency || "USD",
      exchangeRate: parseFloat(exchangeRate) || 1,
      walletAddress: walletAddress || null,
      accountNumber: accountNumber || null,
      routingNumber: routingNumber || null,
      bankName: bankName || null,
      accountName: accountName || null,
      enabled: enabled !== false,
      forDeposit: forDeposit !== false,
      forWithdrawal: forWithdrawal !== false,
      livePriceEnabled: livePriceEnabled === true,
      priceSymbol: priceSymbol || null,
      orderIndex: parseInt(orderIndex) || 0,
    },
  });

  return NextResponse.json({ id: method.id }, { status: 201 });
}
