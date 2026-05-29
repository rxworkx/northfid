import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await req.json();
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { emailVerifyCode: true } });

  if (!user?.emailVerifyCode || user.emailVerifyCode !== code) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
  }

  await db.user.update({ where: { id: session.user.id }, data: { emailVerified: true, emailVerifyCode: null } });
  return NextResponse.json({ success: true });
}
