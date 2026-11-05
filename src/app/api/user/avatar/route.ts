import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { detectImageType, uploadFile, deleteFile } from "@/lib/storage";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const type = detectImageType(buffer);
  if (!type) return NextResponse.json({ error: "Invalid file type" }, { status: 400 });

  const filename = `user_${session.user.id}_${Date.now()}${type.ext}`;
  const path = `users/${filename}`;

  const existing = await db.user.findUnique({ where: { id: session.user.id }, select: { image: true } });
  if (existing?.image) {
    await deleteFile("uploads", `users/${existing.image}`).catch(() => {});
  }

  await uploadFile("uploads", path, buffer, type.mime);

  await db.user.update({ where: { id: session.user.id }, data: { image: filename } });

  revalidatePath("/dashboard", "layout");

  return NextResponse.json({ filename });
}
