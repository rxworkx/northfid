import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validations";
import { generateReferralCode, generateVerificationCode } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, country, username, password, referrerCode } = parsed.data;

    const [existingEmail, existingUsername] = await Promise.all([
      db.user.findUnique({ where: { email } }),
      db.user.findUnique({ where: { username } }),
    ]);

    if (existingEmail) return NextResponse.json({ error: "Email already registered." }, { status: 409 });
    if (existingUsername) return NextResponse.json({ error: "Username is already taken." }, { status: 409 });

    let referrerId: string | undefined;
    if (referrerCode) {
      const referrer = await db.user.findFirst({
        where: { OR: [{ referralCode: referrerCode }, { username: referrerCode }] },
      });
      referrerId = referrer?.id;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const referralCode = generateReferralCode(username);
    const verifyCode = generateVerificationCode();

    const newUser = await db.user.create({
      data: {
        firstName,
        lastName,
        email,
        country,
        username,
        password: hashedPassword,
        referralCode,
        referrerId,
        emailVerifyCode: verifyCode,
      },
    });

    // Welcome notification
    await (db as any).notification.create({
      data: {
        userId: newUser.id,
        type: "welcome",
        title: "Welcome to Pipnova!",
        body: "Your account is ready. Fund your wallet and start copy trading.",
        href: "/dashboard/fund-account",
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[REGISTER]", err);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
