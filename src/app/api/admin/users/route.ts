import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, unauthorized } from "../_auth";
import bcrypt from "bcryptjs";
import { generateReferralCode } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;

  const where: any = {};
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { username: { contains: search, mode: "insensitive" } },
    ];
  }
  if (status) where.status = status;

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, firstName: true, lastName: true, username: true,
        email: true, phone: true, country: true, status: true, role: true,
        emailVerified: true, isCopyTrader: true, createdAt: true,
        wallet: { select: { balance: true } },
        kyc: { select: { status: true } },
        _count: { select: { trades: true, transactions: true } },
      },
    }),
    db.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const body = await req.json();
  const { firstName, lastName, email, username, phone, password, country, role, status } = body;

  if (!firstName || !lastName || !email || !username || !password) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
  }

  const existing = await db.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) return NextResponse.json({ error: "Email or username already taken" }, { status: 409 });

  const hashed = await bcrypt.hash(password, 12);
  const referralCode = generateReferralCode(username);

  const user = await db.user.create({
    data: {
      firstName, lastName, email, username,
      phone: phone || null,
      password: hashed,
      country: country || "",
      role: role || "user",
      status: status || "active",
      referralCode,
      wallet: { create: { balance: 0 } },
    },
  });

  return NextResponse.json({ id: user.id }, { status: 201 });
}
