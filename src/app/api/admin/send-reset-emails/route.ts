import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, unauthorized } from "../_auth";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST() {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const users = await db.user.findMany({
    where: { mustResetPassword: true, passwordResetToken: { not: null } },
    select: { id: true, firstName: true, email: true, passwordResetToken: true },
  });

  if (users.length === 0) return NextResponse.json({ sent: 0, message: "No pending users" });

  let sent = 0;
  const errors: string[] = [];

  for (const user of users) {
    try {
      await sendPasswordResetEmail(user.email, user.firstName, user.passwordResetToken!);
      sent++;
    } catch (e) {
      errors.push(user.email);
      console.error(`[send-reset-emails] failed for ${user.email}:`, e);
    }
  }

  return NextResponse.json({ sent, total: users.length, errors });
}
