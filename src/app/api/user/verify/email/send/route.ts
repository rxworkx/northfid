import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generateVerificationCode } from "@/lib/utils";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const code = generateVerificationCode();
  await db.user.update({ where: { id: session.user.id }, data: { emailVerifyCode: code } });

  if (process.env.NODE_ENV === "development") {
    const user = await db.user.findUnique({ where: { id: session.user.id }, select: { email: true } });
    console.log(`[EMAIL VERIFY] ${user?.email} → code: ${code}`);
  }

  return NextResponse.json({ success: true });
}
