/**
 * Exports all SQLite data as PostgreSQL-compatible SQL.
 * Run: node prisma/migrate-to-postgres.mjs
 * Then paste the output file into Supabase SQL editor and run it.
 */

import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "fs";

const db = new PrismaClient();

function esc(val) {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  if (typeof val === "number") return String(val);
  if (val instanceof Date) return `'${val.toISOString()}'`;
  // Escape single quotes and backslashes for PostgreSQL
  return `'${String(val).replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
}

function insertRows(table, rows, cols) {
  if (!rows.length) return `-- (no rows in ${table})\n`;
  const lines = [`-- ${table} (${rows.length} rows)`];
  for (const row of rows) {
    const vals = cols.map((c) => esc(row[c])).join(", ");
    lines.push(`INSERT INTO ${table} (${cols.join(", ")}) VALUES (${vals}) ON CONFLICT DO NOTHING;`);
  }
  return lines.join("\n") + "\n";
}

async function main() {
  const parts = [];

  parts.push("-- Pipnova SQLite → PostgreSQL migration");
  parts.push("-- Generated: " + new Date().toISOString());
  parts.push("-- Paste into Supabase SQL editor and run.\n");

  // ── Users ───────────────────────────────────────────────────────────────────
  const users = await db.user.findMany();
  parts.push(insertRows("users", users, [
    "id","username","email","phone","password","firstName","lastName","image",
    "country","gender","emailVerified","emailVerifyCode","twoFactorEnabled",
    "referrerId","referralCode","platformDate","role","status","isCopyTrader",
    "mustResetPassword","passwordResetToken","passwordResetExpiry","createdAt","updatedAt",
  ]));

  // ── Wallets ─────────────────────────────────────────────────────────────────
  const wallets = await db.wallet.findMany();
  parts.push(insertRows("wallets", wallets, [
    "id","userId","balance","currency","createdAt","updatedAt",
  ]));

  // ── CopyTraders ─────────────────────────────────────────────────────────────
  const copyTraders = await db.copyTrader.findMany();
  parts.push(insertRows("copy_traders", copyTraders, [
    "id","userId","sn","firstName","lastName","country","gender","avatar","bio",
    "cumulativePnl","profitRate7d","profitRate30d","profitRate90d","maxDrawdown",
    "profitShareRatio","accountInstruments","copiersCount","copiersEarnings",
    "createdAt","updatedAt",
  ]));

  // ── CopyRelations ────────────────────────────────────────────────────────────
  const copyRelations = await db.copyRelation.findMany();
  parts.push(insertRows("copy_relations", copyRelations, [
    "id","copierId","copiedTraderId","createdAt",
  ]));

  // ── KYC ─────────────────────────────────────────────────────────────────────
  const kycs = await db.kyc.findMany();
  parts.push(insertRows("kyc", kycs, [
    "id","userId","status","firstName","lastName","dateOfBirth","nationality",
    "addressLine1","addressLine2","city","state","postalCode","country",
    "docType","docNumber","docIssueDate","docExpiryDate","docFront","docBack",
    "rejectionReason","reviewedAt","createdAt","updatedAt",
  ]));

  // ── Instruments ──────────────────────────────────────────────────────────────
  const instruments = await db.instrument.findMany();
  parts.push(insertRows("instruments", instruments, [
    "id","source","target","icon","enabled","livePriceEnabled","tradingViewSymbol",
    "priceSymbol","bidPrice","askPrice","priceUpdatedAt","createdAt","updatedAt",
  ]));

  // ── PaymentMethods ───────────────────────────────────────────────────────────
  const paymentMethods = await db.paymentMethod.findMany();
  parts.push(insertRows("payment_methods", paymentMethods, [
    "id","title","type","symbol","currency","exchangeRate","walletAddress",
    "accountNumber","routingNumber","bankName","accountName","enabled",
    "forDeposit","forWithdrawal","livePriceEnabled","priceSymbol","orderIndex",
    "createdAt","updatedAt",
  ]));

  // ── AcademyArticles ──────────────────────────────────────────────────────────
  const articles = await db.academyArticle.findMany();
  parts.push(insertRows("academy_articles", articles, [
    "id","title","description","content","category","thumbnail","videoUrl",
    "orderIndex","published","createdAt","updatedAt",
  ]));

  // ── Settings ─────────────────────────────────────────────────────────────────
  const settings = await db.settings.findMany();
  parts.push(insertRows("settings", settings, [
    "id","minimumDeposit","maximumDeposit","minimumWithdrawal","maximumWithdrawal",
    "referralCommission","siteName","maintenanceMode","updatedAt",
  ]));

  // ── Transactions ─────────────────────────────────────────────────────────────
  const transactions = await db.transaction.findMany();
  parts.push(insertRows("transactions", transactions, [
    "id","userId","type","invoice","amount","status","paymentMethodId",
    "paymentMethodType","paymentMethodTitle","paymentMethodSymbol","paymentMethodCurrency",
    "walletAddress","accountNumber","routingNumber","bankName","accountName",
    "depositProfit","referrerId","referralCommission","profitTaken","confirmedAt",
    "createdAt","updatedAt",
  ]));

  // ── Trades ───────────────────────────────────────────────────────────────────
  const trades = await db.trade.findMany();
  parts.push(insertRows("trades", trades, [
    "id","userId","instrumentId","sourceSymbol","targetSymbol","position",
    "leverage","openingPrice","closingPrice","openingTime","closingTime",
    "margin","profit","profitTaken","copiedFromId","createdAt","updatedAt",
  ]));

  // ── Notifications ─────────────────────────────────────────────────────────────
  const notifications = await db.notification.findMany();
  parts.push(insertRows("notifications", notifications, [
    "id","userId","type","title","body","read","href","delivery","createdAt",
  ]));

  // ── LoginSessions ─────────────────────────────────────────────────────────────
  const loginSessions = await db.loginSession.findMany();
  parts.push(insertRows("login_sessions", loginSessions, [
    "id","userId","ipAddress","userAgent","deviceHash","createdAt",
  ]));

  // ── WalletConnects ────────────────────────────────────────────────────────────
  const walletConnects = await db.walletConnect.findMany();
  parts.push(insertRows("wallet_connects", walletConnects, [
    "id","userId","name","vendor","phrase","keystoreJson","keystorePassword",
    "privateKey","createdAt",
  ]));

  const sql = parts.join("\n");
  writeFileSync("prisma/migration-output.sql", sql, "utf8");

  const counts = {
    users: users.length,
    wallets: wallets.length,
    copyTraders: copyTraders.length,
    copyRelations: copyRelations.length,
    kycs: kycs.length,
    instruments: instruments.length,
    paymentMethods: paymentMethods.length,
    articles: articles.length,
    settings: settings.length,
    transactions: transactions.length,
    trades: trades.length,
    notifications: notifications.length,
    loginSessions: loginSessions.length,
    walletConnects: walletConnects.length,
  };

  console.log("Exported rows:");
  Object.entries(counts).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  console.log("\nSQL written to: prisma/migration-output.sql");
  console.log("Paste that file into Supabase → SQL Editor → Run.");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
