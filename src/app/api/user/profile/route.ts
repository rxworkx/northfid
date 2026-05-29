import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { profileSchema } from "@/lib/validations";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { username, firstName, lastName, email, phone, country, gender } = parsed.data;
  const userId = session.user.id;

  // Check uniqueness
  const [dupUsername, dupEmail, dupPhone] = await Promise.all([
    username ? db.user.findFirst({ where: { username, NOT: { id: userId } } }) : null,
    email ? db.user.findFirst({ where: { email, NOT: { id: userId } } }) : null,
    phone ? db.user.findFirst({ where: { phone, NOT: { id: userId } } }) : null,
  ]);

  if (dupUsername) return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  if (dupEmail) return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  if (dupPhone) return NextResponse.json({ error: "Phone number already in use" }, { status: 409 });

  await db.user.update({
    where: { id: userId },
    data: { username, firstName, lastName, email, phone: phone || null, country: country || "", gender: gender || "" },
  });

  return NextResponse.json({ success: true });
}
