import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function getAdminSession() {
  const session = await auth();
  if (!session?.user?.id) return null;
  if ((session.user as any).role !== "admin") return null;
  return session;
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
