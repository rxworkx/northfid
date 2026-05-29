import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join, extname } from "path";
import { existsSync } from "fs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 400 });

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) return NextResponse.json({ error: "Invalid file type" }, { status: 400 });

  const ext = extname(file.name) || ".jpg";
  const filename = `avatar_${session.user.id}_${Date.now()}${ext}`;
  const uploadDir = join(process.cwd(), "public", "uploads", "users");

  if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });

  // Delete old image if set
  const existing = await db.user.findUnique({ where: { id: session.user.id }, select: { image: true } });
  const oldImage = existing?.image;
  if (oldImage) {
    const oldPath = join(uploadDir, oldImage);
    if (existsSync(oldPath)) await unlink(oldPath).catch(() => {});
  }

  const bytes = await file.arrayBuffer();
  await writeFile(join(uploadDir, filename), Buffer.from(bytes));

  await db.user.update({ where: { id: session.user.id }, data: { image: filename } });

  return NextResponse.json({ filename });
}
