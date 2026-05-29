import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";
import { sendForgotPasswordEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required." }, { status: 400 });

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, firstName: true, email: true },
    });

    // Always return success to prevent email enumeration
    if (!user) return NextResponse.json({ success: true });

    const token = randomUUID();
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpiry: expiry },
    });

    await sendForgotPasswordEmail(user.email, user.firstName, token);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[forgot-password]", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
