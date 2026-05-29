import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, unauthorized } from "../../_auth";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join, extname } from "path";
import { existsSync } from "fs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { id } = await params;

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    // Image upload
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
    if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: "Max 2MB" }, { status: 400 });

    const ext = extname(file.name) || ".jpg";
    const filename = `trader_${id}_${Date.now()}${ext}`;
    const uploadDir = join(process.cwd(), "public", "uploads", "traders");
    if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });

    const existing = await db.$queryRawUnsafe<Array<{ image: string | null }>>(
      `SELECT avatar FROM copy_traders WHERE id = ?`, id
    );
    const oldImage = existing[0]?.avatar;
    if (oldImage) {
      const oldPath = join(uploadDir, oldImage);
      if (existsSync(oldPath)) await unlink(oldPath).catch(() => {});
    }

    const bytes = await file.arrayBuffer();
    await writeFile(join(uploadDir, filename), Buffer.from(bytes));
    await db.$executeRawUnsafe(`UPDATE copy_traders SET avatar = ? WHERE id = ?`, filename, id);
    return NextResponse.json({ filename });
  }

  const body = await req.json();
  const {
    firstName, lastName, country, gender,
    sn, bio, cumulativePnl, profitRate7d, profitRate30d, profitRate90d,
    maxDrawdown, profitShareRatio, accountInstruments, copiersCount, copiersEarnings,
  } = body;

  // Build the SET clause dynamically to avoid Prisma type issues
  const sets: string[] = [];
  const vals: unknown[] = [];

  if (firstName !== undefined) { sets.push("firstName = ?"); vals.push(firstName || null); }
  if (lastName !== undefined) { sets.push("lastName = ?"); vals.push(lastName || null); }
  if (country !== undefined) { sets.push("country = ?"); vals.push(country || null); }
  if (gender !== undefined) { sets.push("gender = ?"); vals.push(gender || null); }
  if (sn !== undefined) { sets.push("sn = ?"); vals.push(parseInt(sn)); }
  if (bio !== undefined) { sets.push("bio = ?"); vals.push(bio || null); }
  if (cumulativePnl !== undefined) { sets.push("cumulativePnl = ?"); vals.push(parseFloat(cumulativePnl)); }
  if (profitRate7d !== undefined) { sets.push("profitRate7d = ?"); vals.push(parseFloat(profitRate7d)); }
  if (profitRate30d !== undefined) { sets.push("profitRate30d = ?"); vals.push(parseFloat(profitRate30d)); }
  if (profitRate90d !== undefined) { sets.push("profitRate90d = ?"); vals.push(parseFloat(profitRate90d)); }
  if (maxDrawdown !== undefined) { sets.push("maxDrawdown = ?"); vals.push(parseFloat(maxDrawdown)); }
  if (profitShareRatio !== undefined) { sets.push("profitShareRatio = ?"); vals.push(parseFloat(profitShareRatio)); }
  if (accountInstruments !== undefined) { sets.push("accountInstruments = ?"); vals.push(parseInt(accountInstruments)); }
  if (copiersCount !== undefined) { sets.push("copiersCount = ?"); vals.push(parseInt(copiersCount)); }
  if (copiersEarnings !== undefined) { sets.push("copiersEarnings = ?"); vals.push(parseFloat(copiersEarnings)); }

  if (sets.length === 0) return NextResponse.json({ ok: true });

  sets.push("updatedAt = ?");
  vals.push(new Date().toISOString());
  vals.push(id);

  await db.$executeRawUnsafe(
    `UPDATE copy_traders SET ${sets.join(", ")} WHERE id = ?`,
    ...vals
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { id } = await params;
  const ct = await db.copyTrader.findUnique({ where: { id } });
  if (!ct) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.copyTrader.delete({ where: { id } });
  if (ct.userId) await db.user.update({ where: { id: ct.userId }, data: { isCopyTrader: false } });

  return NextResponse.json({ ok: true });
}
