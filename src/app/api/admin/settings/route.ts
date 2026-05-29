import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, unauthorized } from "../_auth";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  let settings = await db.settings.findUnique({ where: { id: "singleton" } });
  if (!settings) {
    settings = await db.settings.create({ data: { id: "singleton" } });
  }
  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const body = await req.json();
  const { minimumDeposit, maximumDeposit, minimumWithdrawal, maximumWithdrawal, referralCommission, siteName, maintenanceMode } = body;

  const data: any = {};
  if (minimumDeposit !== undefined) data.minimumDeposit = parseFloat(minimumDeposit);
  if (maximumDeposit !== undefined) data.maximumDeposit = parseFloat(maximumDeposit);
  if (minimumWithdrawal !== undefined) data.minimumWithdrawal = parseFloat(minimumWithdrawal);
  if (maximumWithdrawal !== undefined) data.maximumWithdrawal = parseFloat(maximumWithdrawal);
  if (referralCommission !== undefined) data.referralCommission = parseFloat(referralCommission);
  if (siteName !== undefined) data.siteName = siteName;
  if (maintenanceMode !== undefined) data.maintenanceMode = maintenanceMode;

  const settings = await db.settings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });

  return NextResponse.json(settings);
}
