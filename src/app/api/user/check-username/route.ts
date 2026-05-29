import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username") ?? "";
  const currentUsername = searchParams.get("current") ?? "";

  if (!username || username.length < 3) {
    return NextResponse.json({ available: false });
  }

  if (username === currentUsername) {
    return NextResponse.json({ available: true });
  }

  const existing = await db.user.findUnique({ where: { username } });
  return NextResponse.json({ available: !existing });
}
