import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config as loadEnv } from "dotenv";
import { existsSync } from "fs";

if (existsSync(".env.production")) loadEnv({ path: ".env.production", override: true });
else loadEnv({ override: true });

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  // Find any pending withdrawal in the DB
  const tx = await db.transaction.findFirst({
    where: { type: "withdrawal", status: "pending" },
    include: { user: { select: { id: true, email: true, wallet: true } } },
  });

  if (!tx) {
    console.log("No pending withdrawal found. Creating one for demo user...");
    const user = await db.user.findUnique({ where: { email: "demo@example.com" }, select: { id: true, wallet: true } });
    if (!user) { console.log("Demo user not found"); return; }
    const pm = await db.paymentMethod.findFirst({ where: { forWithdrawal: true } });
    await db.transaction.create({
      data: { userId: user.id, type: "withdrawal", invoice: `TEST-${Date.now()}`, amount: 50, status: "pending", paymentMethodId: pm!.id, paymentMethodType: pm!.type, paymentMethodTitle: pm!.title },
    });
    console.log("Created. Re-run script.");
    return;
  }

  console.log("Found pending withdrawal:");
  console.log("  tx.id:", tx.id);
  console.log("  tx.type:", tx.type);
  console.log("  tx.status:", tx.status);
  console.log("  tx.amount:", tx.amount);
  console.log("  user:", tx.user.email);
  console.log("  wallet balance before:", tx.user.wallet?.balance ?? "NO WALLET");

  // Exact same code as PATCH route
  const status = "confirmed";

  await db.transaction.update({
    where: { id: tx.id },
    data: { status, confirmedAt: status === "confirmed" ? new Date() : tx.confirmedAt },
  });
  console.log("\nTransaction updated to confirmed.");

  const isBalanceDeposit = tx.type === "deposit" && tx.paymentMethodType === "balance";
  console.log("isBalanceDeposit:", isBalanceDeposit);
  console.log("Condition: tx.type === withdrawal:", tx.type === "withdrawal");
  console.log("Condition: status === confirmed:", status === "confirmed");
  console.log("Condition: tx.status !== confirmed:", tx.status !== "confirmed");

  if (tx.type === "withdrawal" && status === "confirmed" && tx.status !== "confirmed") {
    console.log("\nRunning wallet.update decrement...");
    const result = await db.wallet.update({
      where: { userId: tx.userId },
      data: { balance: { decrement: tx.amount } },
    });
    console.log("Wallet updated. New balance:", result.balance);
  } else {
    console.log("\nWallet update NOT triggered — conditions not met.");
  }

  const after = await db.user.findUnique({ where: { id: tx.userId }, select: { wallet: { select: { balance: true } } } });
  console.log("\nFinal wallet balance:", after?.wallet?.balance);
  console.log("Expected:", (tx.user.wallet?.balance ?? 0) - tx.amount);
  console.log("PASS:", Math.abs((after?.wallet?.balance ?? 0) - ((tx.user.wallet?.balance ?? 0) - tx.amount)) < 0.001);
}

main().catch(console.error).finally(() => db.$disconnect());
