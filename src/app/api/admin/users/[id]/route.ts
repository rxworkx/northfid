import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, unauthorized } from "../../_auth";
import bcrypt from "bcryptjs";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id },
    include: {
      wallet: true,
      kyc: true,
      copyTrader: true,
      transactions: { orderBy: { createdAt: "desc" }, take: 10 },
      trades: { orderBy: { createdAt: "desc" }, take: 10, include: { instrument: { select: { source: true, target: true } } } },
      loginSessions: { orderBy: { createdAt: "desc" }, take: 5 },
      _count: { select: { transactions: true, trades: true, referrals: true } },
    },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { id } = await params;
  const body = await req.json();
  const { firstName, lastName, username, email, phone, country, status, role, emailVerified, password, walletBalance, mustResetPassword, allowFundFromBalance } = body;

  // Only the main admin (first admin by createdAt) can set role=admin
  if (role === "admin") {
    const mainAdmin = await db.user.findFirst({ where: { role: "admin" }, orderBy: { createdAt: "asc" }, select: { id: true } });
    if (mainAdmin?.id !== session.user!.id) {
      return NextResponse.json({ error: "Only the main admin can assign admin roles" }, { status: 403 });
    }
  }

  const updateData: any = {};
  if (firstName !== undefined) updateData.firstName = firstName;
  if (lastName !== undefined) updateData.lastName = lastName;
  if (username !== undefined) updateData.username = username || null;
  if (email !== undefined) updateData.email = email;
  if (phone !== undefined) updateData.phone = phone || null;
  if (country !== undefined) updateData.country = country;
  if (status !== undefined) updateData.status = status;
  if (role !== undefined) updateData.role = role;
  if (emailVerified !== undefined) updateData.emailVerified = emailVerified;
  if (mustResetPassword !== undefined) updateData.mustResetPassword = mustResetPassword;
  if (allowFundFromBalance !== undefined) updateData.allowFundFromBalance = allowFundFromBalance;
  if (password) {
    updateData.password = await bcrypt.hash(password, 12);
    updateData.mustResetPassword = false;
    updateData.passwordResetToken = null;
    updateData.passwordResetExpiry = null;
  }

  await db.user.update({ where: { id }, data: updateData });

  if (walletBalance !== undefined) {
    await db.wallet.upsert({
      where: { userId: id },
      update: { balance: parseFloat(walletBalance) },
      create: { userId: id, balance: parseFloat(walletBalance) },
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { id } = await params;

  const mainAdmin = await db.user.findFirst({ where: { role: "admin" }, orderBy: { createdAt: "asc" }, select: { id: true } });
  if (mainAdmin?.id === id) {
    return NextResponse.json({ error: "The main admin account cannot be deleted" }, { status: 403 });
  }

  await db.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
