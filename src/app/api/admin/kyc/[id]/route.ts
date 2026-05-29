import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, unauthorized } from "../../_auth";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { id } = await params;
  const kyc = await db.kyc.findUnique({
    where: { id },
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
  });
  if (!kyc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(kyc);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { id } = await params;
  const { status, rejectionReason } = await req.json();

  await db.kyc.update({
    where: { id },
    data: {
      status,
      rejectionReason: status === "rejected" ? (rejectionReason || null) : null,
      reviewedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
