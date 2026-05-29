import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { withdrawSchema } from "@/lib/validations";
import { generateInvoiceNumber } from "@/lib/utils";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = withdrawSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { amount, paymentMethodId, walletAddress, accountNumber, routingNumber, bankName, accountName, password } = parsed.data;
  const userId = session.user.id;

  const [user, settings, pm] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { password: true, wallet: { select: { balance: true } } } }),
    db.settings.findUnique({ where: { id: "singleton" } }),
    db.paymentMethod.findUnique({ where: { id: paymentMethodId } }),
  ]);

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const isValidPass = await bcrypt.compare(password, user.password);
  if (!isValidPass) return NextResponse.json({ error: "Incorrect password" }, { status: 401 });

  const min = settings?.minimumWithdrawal ?? 50;
  const max = settings?.maximumWithdrawal ?? 50000;

  if (amount < min) return NextResponse.json({ error: `Minimum withdrawal is $${min}` }, { status: 400 });
  if (amount > max) return NextResponse.json({ error: `Maximum withdrawal is $${max}` }, { status: 400 });
  const balance = (user as any).wallet?.balance ?? 0;
  if (amount > balance) return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
  if (!pm || !pm.enabled || !pm.forWithdrawal) return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });

  if (pm.type === "crypto" && !walletAddress) {
    return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
  }

  const invoice = generateInvoiceNumber();

  await db.transaction.create({
    data: {
      userId,
      type: "withdrawal",
      invoice,
      amount,
      status: "pending",
      paymentMethodId: pm.id,
      paymentMethodType: pm.type,
      paymentMethodTitle: pm.title,
      paymentMethodSymbol: pm.symbol,
      paymentMethodCurrency: pm.currency,
      walletAddress: walletAddress ?? null,
      accountNumber: accountNumber ?? null,
      routingNumber: routingNumber ?? null,
      bankName: bankName ?? null,
      accountName: accountName ?? null,
    },
  });

  return NextResponse.json({ invoice }, { status: 201 });
}
