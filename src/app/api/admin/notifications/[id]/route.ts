import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, unauthorized } from "../../_auth";

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { id } = await params;

  // Find the representative record to get the batch key
  const notif = await db.notification.findUnique({ where: { id } });
  if (!notif) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete all records in this batch (same title + body + delivery sent together)
  const { count } = await db.notification.deleteMany({
    where: { title: notif.title, body: notif.body, delivery: notif.delivery },
  });

  return NextResponse.json({ deleted: count });
}
