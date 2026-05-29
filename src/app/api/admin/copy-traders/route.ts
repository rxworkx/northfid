import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, unauthorized } from "../_auth";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;

  const where: any = {};
  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { user: { OR: [{ firstName: { contains: search } }, { email: { contains: search } }] } },
    ];
  }

  const [copyTraders, total] = await Promise.all([
    db.copyTrader.findMany({
      where,
      orderBy: { copiersCount: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, userId: true, sn: true, bio: true,
        firstName: true, lastName: true, country: true, gender: true, avatar: true,
        cumulativePnl: true, profitRate7d: true, profitRate30d: true, profitRate90d: true,
        maxDrawdown: true, profitShareRatio: true, accountInstruments: true,
        copiersCount: true, copiersEarnings: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true, username: true } },
      },
    }),
    db.copyTrader.count({ where }),
  ]);

  return NextResponse.json({ copyTraders, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const body = await req.json();
  const {
    userId, firstName, lastName, country, gender,
    sn, bio, cumulativePnl, profitRate7d, profitRate30d, profitRate90d,
    maxDrawdown, profitShareRatio, accountInstruments, copiersCount, copiersEarnings,
  } = body;

  if (userId) {
    const existing = await db.copyTrader.findUnique({ where: { userId } });
    if (existing) return NextResponse.json({ error: "User is already a copy trader" }, { status: 409 });
  }

  const data: any = {
    sn: parseInt(sn) || 0,
    firstName: firstName || null,
    lastName: lastName || null,
    country: country || null,
    gender: gender || null,
    bio: bio || null,
    cumulativePnl: parseFloat(cumulativePnl) || 0,
    profitRate7d: parseFloat(profitRate7d) || 0,
    profitRate30d: parseFloat(profitRate30d) || 0,
    profitRate90d: parseFloat(profitRate90d) || 0,
    maxDrawdown: parseFloat(maxDrawdown) || 0,
    profitShareRatio: parseFloat(profitShareRatio) || 0,
    accountInstruments: parseInt(accountInstruments) || 0,
    copiersCount: parseInt(copiersCount) || 0,
    copiersEarnings: parseFloat(copiersEarnings) || 0,
  };
  if (userId) data.userId = userId;

  await db.copyTrader.create({ data });
  if (userId) await db.user.update({ where: { id: userId }, data: { isCopyTrader: true } });

  return NextResponse.json({ ok: true }, { status: 201 });
}
