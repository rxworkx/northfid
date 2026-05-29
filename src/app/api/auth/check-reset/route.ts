import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";
import { sendForgotPasswordEmail } from "@/lib/email";

export async function POST(req: Request) {
  const { identifier } = await req.json();
  if (!identifier) return NextResponse.json({ mustReset: false });

  const user = await db.user.findFirst({
    where: { OR: [{ email: identifier }, { phone: identifier }, { username: identifier }] },
    select: { id: true, firstName: true, email: true, mustResetPassword: true },
  });

  if (!user?.mustResetPassword) return NextResponse.json({ mustReset: false });

  // Auto-send reset email so user just needs to check inbox
  const token = randomUUID();
  const expiry = new Date(Date.now() + 60 * 60 * 1000);
  await db.user.update({
    where: { id: user.id },
    data: { passwordResetToken: token, passwordResetExpiry: expiry },
  });
  await sendForgotPasswordEmail(user.email, user.firstName, token);

  return NextResponse.json({ mustReset: true });
}
