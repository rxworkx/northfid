import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, unauthorized } from "../../_auth";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { id } = await params;
  const article = await db.academyArticle.findUnique({ where: { id } });
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(article);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { id } = await params;
  const body = await req.json();
  const data: any = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.content !== undefined) data.content = body.content;
  if (body.category !== undefined) data.category = body.category;
  if (body.thumbnail !== undefined) data.thumbnail = body.thumbnail || null;
  if (body.videoUrl !== undefined) data.videoUrl = body.videoUrl || null;
  if (body.orderIndex !== undefined) data.orderIndex = parseInt(body.orderIndex) || 0;
  if (body.published !== undefined) data.published = body.published;

  await db.academyArticle.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { id } = await params;
  await db.academyArticle.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
