import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { traderId, action } = await req.json();
  if (!traderId || !["add", "remove"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const copierId = session.user.id;
  if (copierId === traderId) {
    return NextResponse.json({ error: "Cannot copy yourself" }, { status: 400 });
  }

  try {
    if (action === "add") {
      await db.copyRelation.upsert({
        where: { copierId_copiedTraderId: { copierId, copiedTraderId: traderId } },
        create: { copierId, copiedTraderId: traderId },
        update: {},
      });
      await db.copyTrader.update({
        where: { userId: traderId },
        data: { copiersCount: { increment: 1 } },
      });
    } else {
      await db.copyRelation.deleteMany({
        where: { copierId, copiedTraderId: traderId },
      });
      await db.copyTrader.update({
        where: { userId: traderId },
        data: { copiersCount: { decrement: 1 } },
      });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
