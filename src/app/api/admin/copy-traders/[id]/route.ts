import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, unauthorized } from "../../_auth";
import { detectImageType, uploadFile, deleteFile } from "@/lib/storage";

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

    const buffer = Buffer.from(await file.arrayBuffer());
    const type = detectImageType(buffer);
    if (!type) return NextResponse.json({ error: "Only JPEG/PNG/WEBP allowed" }, { status: 400 });

    const filename = `ct_${Date.now()}${type.ext}`;
    const path = `traders/${filename}`;

    const existing = await db.copyTrader.findUnique({ where: { id }, select: { avatar: true } });
    if (existing?.avatar) {
      await deleteFile("uploads", `traders/${existing.avatar}`).catch(() => {});
    }

    await uploadFile("uploads", path, buffer, type.mime);
    await db.copyTrader.update({ where: { id }, data: { avatar: filename } });
    return NextResponse.json({ filename });
  }

  const body = await req.json();
  const {
    firstName, lastName, country, gender,
    sn, bio, cumulativePnl, profitRate7d, profitRate30d, profitRate90d,
    maxDrawdown, profitShareRatio, accountInstruments, copiersCount, copiersEarnings,
  } = body;

  const data: Record<string, unknown> = {};
  if (firstName !== undefined) data.firstName = firstName || null;
  if (lastName !== undefined) data.lastName = lastName || null;
  if (country !== undefined) data.country = country || null;
  if (gender !== undefined) data.gender = gender || null;
  if (sn !== undefined) data.sn = parseInt(sn);
  if (bio !== undefined) data.bio = bio || null;
  if (cumulativePnl !== undefined) data.cumulativePnl = parseFloat(cumulativePnl);
  if (profitRate7d !== undefined) data.profitRate7d = parseFloat(profitRate7d);
  if (profitRate30d !== undefined) data.profitRate30d = parseFloat(profitRate30d);
  if (profitRate90d !== undefined) data.profitRate90d = parseFloat(profitRate90d);
  if (maxDrawdown !== undefined) data.maxDrawdown = parseFloat(maxDrawdown);
  if (profitShareRatio !== undefined) data.profitShareRatio = parseFloat(profitShareRatio);
  if (accountInstruments !== undefined) data.accountInstruments = parseInt(accountInstruments);
  if (copiersCount !== undefined) data.copiersCount = parseInt(copiersCount);
  if (copiersEarnings !== undefined) data.copiersEarnings = parseFloat(copiersEarnings);

  if (Object.keys(data).length === 0) return NextResponse.json({ ok: true });

  await db.copyTrader.update({ where: { id }, data });

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
