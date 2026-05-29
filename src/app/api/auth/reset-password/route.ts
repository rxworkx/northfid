import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();

  if (!token || !password || password.length < 8) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const user = await db.user.findFirst({
    where: { passwordResetToken: token },
    select: { id: true, passwordResetExpiry: true },
  });

  if (!user) return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
  if (user.passwordResetExpiry && user.passwordResetExpiry < new Date()) {
    return NextResponse.json({ error: "Reset link has expired" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 12);
  await db.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
      mustResetPassword: false,
      passwordResetToken: null,
      passwordResetExpiry: null,
      emailVerified: true,
    },
  });

  return NextResponse.json({ ok: true });
}
