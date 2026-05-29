import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, unauthorized } from "../_auth";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? ""; // open | closed
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;

  const where: any = {};
  if (status === "open") where.closingTime = null;
  if (status === "closed") where.NOT = { closingTime: null };
  if (search) {
    where.OR = [
      { user: { email: { contains: search, mode: "insensitive" } } },
      { user: { username: { contains: search, mode: "insensitive" } } },
      { sourceSymbol: { contains: search, mode: "insensitive" } },
      { targetSymbol: { contains: search, mode: "insensitive" } },
    ];
  }

  const [trades, total] = await Promise.all([
    db.trade.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        instrument: { select: { source: true, target: true } },
      },
    }),
    db.trade.count({ where }),
  ]);

  return NextResponse.json({ trades, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const body = await req.json();
  const { userId, instrumentId, position, leverage, openingPrice, closingPrice, openingTime, closingTime, margin, profit } = body;

  if (!userId || !instrumentId || !position || !openingPrice || !margin) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
  }

  const instrument = await db.instrument.findUnique({ where: { id: instrumentId } });
  if (!instrument) return NextResponse.json({ error: "Instrument not found" }, { status: 404 });

  const trade = await db.trade.create({
    data: {
      userId,
      instrumentId,
      sourceSymbol: instrument.source,
      targetSymbol: instrument.target,
      position,
      leverage: parseInt(leverage) || 1,
      openingPrice: parseFloat(openingPrice),
      closingPrice: closingPrice ? parseFloat(closingPrice) : null,
      openingTime: new Date(openingTime || Date.now()),
      closingTime: closingTime ? new Date(closingTime) : null,
      margin: parseFloat(margin),
      profit: profit !== undefined ? parseFloat(profit) : null,
    },
  });

  return NextResponse.json({ id: trade.id }, { status: 201 });
}
