import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { enabled } = await req.json();
  await db.user.update({ where: { id: session.user.id }, data: { twoFactorEnabled: Boolean(enabled) } });
  return NextResponse.json({ success: true });
}
