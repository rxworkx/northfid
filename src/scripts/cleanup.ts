import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config as loadEnv } from "dotenv";
import { existsSync } from "fs";

if (existsSync(".env.production")) loadEnv({ path: ".env.production", override: true });
else loadEnv({ override: true });

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL! }) });

async function main() {
  const del = await db.transaction.deleteMany({ where: { invoice: { startsWith: "TEST-" } } });
  console.log("Deleted test transactions:", del.count);
  const w = await db.wallet.update({ where: { user: { email: "demo@example.com" } }, data: { balance: 5000 } });
  console.log("Demo balance reset to:", w.balance);
}

main().catch(console.error).finally(() => db.$disconnect());
