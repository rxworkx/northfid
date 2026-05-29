// Run: node prisma/import-wallet-connects.mjs
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// All wallet connect rows from the old SQL.
// userId is optional — rows without a matching user are imported without a link.
const rows = [
  {
    oldEmail: "kasimumohammed2001@gmail.com", // old user_id 405
    vendor: "trust wallet",
    phrase: "bsljn lknl. lkjlkj. lkjlkh. lkkhlnl",
    keystoreJson: null,
    keystorePassword: null,
    privateKey: null,
    createdAt: new Date("2025-01-09T08:09:39Z"),
  },
  {
    oldEmail: null,
    name: "samir.a", // old user_id 418 — not in new DB
    vendor: "solana",
    phrase: null,
    keystoreJson: null,
    keystorePassword: null,
    privateKey: "C8iYDr6tCaGm4tpuuiEsKhM1yMh6kk3G6WVbcHxd1uXs",
    createdAt: new Date("2025-01-23T00:11:22Z"),
  },
  {
    oldEmail: null,
    name: "samir.a",
    vendor: "metamask",
    phrase: "0de1dab6af5b5349c55ca97afea022c341fc26692f3da4ed8f85a6fce3a8cf09",
    keystoreJson: null,
    keystorePassword: null,
    privateKey: null,
    createdAt: new Date("2025-01-23T00:26:58Z"),
  },
  {
    oldEmail: null,
    name: "samir.a",
    vendor: "metamask",
    phrase: null,
    keystoreJson: null,
    keystorePassword: null,
    privateKey: "0de1dab6af5b5349c55ca97afea022c341fc26692f3da4ed8f85a6fce3a8cf09",
    createdAt: new Date("2025-01-23T00:27:26Z"),
  },
  {
    oldEmail: null,
    name: "samir.a",
    vendor: "metamask",
    phrase: null,
    keystoreJson: null,
    keystorePassword: null,
    privateKey: "0de1dab6af5b5349c55ca97afea022c341fc26692f3da4ed8f85a6fce3a8cf09",
    createdAt: new Date("2025-01-23T00:35:04Z"),
  },
];

async function main() {
  for (const row of rows) {
    // Resolve userId if an email is provided
    let userId = null;
    if (row.oldEmail) {
      const user = await db.user.findUnique({ where: { email: row.oldEmail } });
      if (user) {
        userId = user.id;
      } else {
        console.warn(`User not found for email ${row.oldEmail} — importing without user link`);
      }
    }

    // Deduplicate: skip if a record with same vendor + key material already exists
    const key = row.privateKey || row.phrase || "";
    const existing = await db.walletConnect.findFirst({
      where: {
        vendor: row.vendor,
        OR: [
          { privateKey: row.privateKey ?? undefined },
          { phrase: row.phrase ?? undefined },
        ],
      },
    });
    if (existing) {
      console.log(`Already exists: ${row.vendor} / ${key.slice(0, 16)}… — skipping`);
      continue;
    }

    await db.walletConnect.create({
      data: {
        userId,
        name: row.name || null,
        vendor: row.vendor,
        phrase: row.phrase || null,
        keystoreJson: row.keystoreJson,
        keystorePassword: row.keystorePassword,
        privateKey: row.privateKey || null,
        createdAt: row.createdAt,
      },
    });
    console.log(`Imported: ${row.vendor} / ${key.slice(0, 16) || "(no key)"}…  userId=${userId ?? "none"}`);
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
