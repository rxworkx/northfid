import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, unauthorized } from "../_auth";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "";
  const search = searchParams.get("search") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;

  const where: any = {};
  if (status) where.status = status;
  if (search) {
    where.user = {
      OR: [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ],
    };
  }

  const [kycs, total] = await Promise.all([
    db.kyc.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, username: true } } },
    }),
    db.kyc.count({ where }),
  ]);

  return NextResponse.json({ kycs, total, page, pages: Math.ceil(total / limit) });
}
