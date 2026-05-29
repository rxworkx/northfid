import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, unauthorized } from "../_auth";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const enabled = searchParams.get("enabled");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 30;

  const where: any = {};
  if (enabled === "true") where.enabled = true;
  if (enabled === "false") where.enabled = false;
  if (search) {
    where.OR = [
      { source: { contains: search, mode: "insensitive" } },
      { target: { contains: search, mode: "insensitive" } },
    ];
  }

  const [instruments, total] = await Promise.all([
    db.instrument.findMany({
      where,
      orderBy: [{ source: "asc" }, { target: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.instrument.count({ where }),
  ]);

  return NextResponse.json({ instruments, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const body = await req.json();
  const { source, target, tradingViewSymbol, priceSymbol, enabled, livePriceEnabled } = body;

  if (!source || !target) return NextResponse.json({ error: "source and target required" }, { status: 400 });

  const instrument = await db.instrument.create({
    data: {
      source: source.toUpperCase(),
      target: target.toUpperCase(),
      tradingViewSymbol: tradingViewSymbol || null,
      priceSymbol: priceSymbol || null,
      enabled: enabled !== false,
      livePriceEnabled: livePriceEnabled === true,
    },
  });

  return NextResponse.json({ id: instrument.id }, { status: 201 });
}
