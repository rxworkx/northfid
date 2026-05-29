import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, unauthorized } from "../_auth";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;

  const where: any = {};
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [articles, total] = await Promise.all([
    db.academyArticle.findMany({
      where,
      orderBy: { orderIndex: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      select: { id: true, title: true, description: true, category: true, published: true, orderIndex: true, thumbnail: true, createdAt: true },
    }),
    db.academyArticle.count({ where }),
  ]);

  return NextResponse.json({ articles, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const body = await req.json();
  const { title, description, content, category, thumbnail, videoUrl, orderIndex, published } = body;

  if (!title || !description || !content || !category) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
  }

  const article = await db.academyArticle.create({
    data: {
      title,
      description,
      content,
      category,
      thumbnail: thumbnail || null,
      videoUrl: videoUrl || null,
      orderIndex: parseInt(orderIndex) || 0,
      published: published !== false,
    },
  });

  return NextResponse.json({ id: article.id }, { status: 201 });
}
