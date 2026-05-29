import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { copyTraderId, action } = await req.json();
  if (!copyTraderId || !["add", "remove"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const copierId = session.user.id;

  const ct = await db.copyTrader.findUnique({ where: { id: copyTraderId }, select: { id: true } });
  if (!ct) return NextResponse.json({ error: "Trader not found" }, { status: 404 });

  try {
    if (action === "add") {
      await db.copyRelation.upsert({
        where: { copierId_copiedTraderId: { copierId, copiedTraderId: copyTraderId } },
        create: { copierId, copiedTraderId: copyTraderId },
        update: {},
      });
      await db.copyTrader.update({ where: { id: copyTraderId }, data: { copiersCount: { increment: 1 } } });
    } else {
      await db.copyRelation.deleteMany({ where: { copierId, copiedTraderId: copyTraderId } });
      await db.copyTrader.update({ where: { id: copyTraderId }, data: { copiersCount: { decrement: 1 } } });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
