import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { depositSchema } from "@/lib/validations";
import { generateInvoiceNumber } from "@/lib/utils";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = depositSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { amount, paymentMethodId } = parsed.data;
  const userId = session.user.id;

  const [settings, pm, user] = await Promise.all([
    db.settings.findUnique({ where: { id: "singleton" } }),
    db.paymentMethod.findUnique({ where: { id: paymentMethodId } }),
    db.user.findUnique({ where: { id: userId }, select: { allowFundFromBalance: true, wallet: { select: { balance: true } } } }),
  ]);

  const min = settings?.minimumDeposit ?? 100;
  const max = settings?.maximumDeposit ?? 100000;

  if (amount < min) return NextResponse.json({ error: `Minimum deposit is $${min}` }, { status: 400 });
  if (amount > max) return NextResponse.json({ error: `Maximum deposit is $${max}` }, { status: 400 });
  if (!pm || !pm.enabled || !pm.forDeposit) return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });

  // Balance deposit: check site + user permissions, validate sufficient funds, deduct immediately
  if (pm.type === "balance") {
    if (!settings?.allowFundFromBalance) {
      return NextResponse.json({ error: "Fund from Balance is currently disabled" }, { status: 400 });
    }
    if (!user?.allowFundFromBalance) {
      return NextResponse.json({ error: "Fund from Balance is not available for your account" }, { status: 400 });
    }
    const currentBalance = user?.wallet?.balance ?? 0;
    if (amount > currentBalance) {
      return NextResponse.json({ error: `Insufficient balance. Available: $${currentBalance.toFixed(2)}` }, { status: 400 });
    }
    const invoice = generateInvoiceNumber();
    await db.$transaction([
      db.wallet.update({ where: { userId }, data: { balance: { decrement: amount } } }),
      db.transaction.create({
        data: {
          userId, type: "deposit", invoice, amount, status: "pending",
          paymentMethodId: pm.id, paymentMethodType: pm.type,
          paymentMethodTitle: pm.title, paymentMethodSymbol: null,
          paymentMethodCurrency: pm.currency,
        },
      }),
    ]);
    return NextResponse.json({ invoice }, { status: 201 });
  }

  const invoice = generateInvoiceNumber();

  await db.transaction.create({
    data: {
      userId,
      type: "deposit",
      invoice,
      amount,
      status: "pending",
      paymentMethodId: pm.id,
      paymentMethodType: pm.type,
      paymentMethodTitle: pm.title,
      paymentMethodSymbol: pm.symbol,
      paymentMethodCurrency: pm.currency,
      walletAddress: pm.walletAddress,
      accountNumber: pm.accountNumber,
      routingNumber: pm.routingNumber,
      bankName: pm.bankName,
      accountName: pm.accountName,
    },
  });

  return NextResponse.json({ invoice }, { status: 201 });
}
