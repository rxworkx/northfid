/**
 * Import wallet balances, transactions, and trades from the old pipnova_old MySQL dump.
 * Run: node prisma/import-data.mjs
 *
 * Prerequisites (run in this order):
 *   1. npx prisma db seed                  → instruments + payment methods + seed users
 *   2. node prisma/import-users.mjs        → email users (referralCode = 'imp-{id}')
 *   3. npx tsx prisma/import-traders.ts    → copy traders (id = 'old-trader-{id}')
 *   4. node prisma/import-data.mjs         → wallets + transactions + trades  (this script)
 */

import { readFileSync } from 'fs';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();
const sql = readFileSync('c:/Users/Carters/php-docs/pipnova_old/unitzelc_pipnova.sql', 'utf8');

// ─── SQL row parser ────────────────────────────────────────────────────────────
// Parses a single VALUES row like: (1, 'foo', NULL, 3.5) or 1, 'foo', NULL, 3.5)
// Quote chars are consumed but not included in field values.
function parseFields(row) {
  const fields = [];
  let current = '';
  let inQuote = false;
  const start = row.startsWith('(') ? 1 : 0;
  for (let c = start; c < row.length; c++) {
    const ch = row[c];
    if (ch === "'") { inQuote = !inQuote; }
    else if (ch === ',' && !inQuote) { fields.push(current.trim()); current = ''; }
    else if (ch === ')' && !inQuote) { break; }
    else { current += ch; }
  }
  fields.push(current.trim());
  return fields;
}

// Extract all rows from all INSERT blocks for a given table name.
function parseTable(tableName) {
  const regex = new RegExp('INSERT INTO `' + tableName + '`[^;]+;', 'gs');
  const rows = [];
  for (const match of sql.matchAll(regex)) {
    const block = match[0];
    const valMatch = block.match(/VALUES\s*\n/);
    if (!valMatch) continue;
    const valStr = block.substring(valMatch.index + valMatch[0].length);
    for (const part of valStr.split(/\),\s*\n\(/)) {
      rows.push(parseFields(part.trim()));
    }
  }
  return rows;
}

// Coerce raw parsed strings to typed values.
function unq(s) {
  if (s === null || s === undefined) return null;
  const t = s.trim();
  return t === 'NULL' ? null : t;
}
function num(s) {
  const v = unq(s);
  return v === null ? null : parseFloat(v);
}
// Return null for NULL, empty string, or the placeholder value '0'.
function nullIfBlank(s) {
  const v = unq(s);
  return !v || v === '0' ? null : v;
}

// ─── Build old-ID → new-ID user map (email users only) ───────────────────────

console.log('Building user ID map...');

const emailUsers = await db.user.findMany({
  where: { referralCode: { startsWith: 'imp-' } },
  select: { id: true, referralCode: true },
});

// Map: oldNumericId → new CUID string (email users only; copy traders are not users)
const oldToNew = new Map();
for (const u of emailUsers) {
  oldToNew.set(parseInt(u.referralCode.slice(4)), u.id);
}

console.log(`  ${oldToNew.size} email users mapped\n`);

// ─── 1. Wallet balances ───────────────────────────────────────────────────────

console.log('Setting wallet balances from old user table...');
const userRows = parseTable('user');
let wUpdated = 0, wSkipped = 0;

for (const f of userRows) {
  const oldId = parseInt(unq(f[0]));
  const newId = oldToNew.get(oldId);
  if (!newId) { wSkipped++; continue; }

  const balance = num(f[10]) ?? 0; // f[10] = user_walletbalance

  await db.wallet.upsert({
    where: { userId: newId },
    update: { balance },
    create: { userId: newId, balance, currency: 'USD' },
  });
  wUpdated++;
}
console.log(`  Updated: ${wUpdated}  Skipped: ${wSkipped}\n`);

// ─── 2. Transactions ──────────────────────────────────────────────────────────

console.log('Importing transactions...');
// Old type → new type (tr_ref and unknown types are skipped)
const TX_TYPE = { d: 'deposit', w: 'withdrawal', tr: 'trade_profit' };

const txRows = parseTable('transaction');
let txImported = 0, txSkipped = 0;

// Pre-load existing invoice set to avoid duplicate-key errors on re-run.
const existingInvoices = new Set(
  (await db.transaction.findMany({ select: { invoice: true } })).map(t => t.invoice)
);

for (const f of txRows) {
  // f[2] = user_id, f[7] = transaction_type
  const oldUserId = parseInt(unq(f[2]));
  if (!oldUserId) { txSkipped++; continue; } // user_id = 0 (system entries)

  const newUserId = oldToNew.get(oldUserId);
  if (!newUserId) { txSkipped++; continue; } // user not in new DB

  const oldType = unq(f[7]);
  if (oldType === 'tr_ref') { txSkipped++; continue; } // mirrored system entry
  const newType = TX_TYPE[oldType];
  if (!newType) { txSkipped++; continue; } // unknown type

  const invoice = `old-tx-${unq(f[6])}`; // f[6] = transaction_invoice
  if (existingInvoices.has(invoice)) { txSkipped++; continue; }

  // f[9] = transaction_status; 'tr' entries have NULL status → treat as confirmed
  const rawStatus = unq(f[9]);
  const status = rawStatus ?? 'confirmed';

  const amount            = num(f[10]) ?? 0;  // transaction_amount
  const depositProfit     = num(f[11]) ?? 0;  // transaction_depositprofit
  const profitTaken       = unq(f[14]) === 'yes'; // transaction_profittaken

  const paymentMethodType     = nullIfBlank(f[15]); // transaction_pm_type
  const paymentMethodTitle    = nullIfBlank(f[16]); // transaction_pm_title
  const paymentMethodSymbol   = nullIfBlank(f[17]); // transaction_pm_abbreviation
  const paymentMethodCurrency = nullIfBlank(f[18]); // transaction_pm_currency
  const walletAddress         = nullIfBlank(f[20]); // transaction_walletaddress
  const accountNumber         = nullIfBlank(f[21]); // transaction_accountnumber
  const accountName           = nullIfBlank(f[22]); // transaction_accountname
  const bankName              = nullIfBlank(f[23]); // transaction_bankname
  const routingNumber         = nullIfBlank(f[24]); // transaction_routingnumber

  // f[29] = transaction_unixtimeconfirmed, f[34] = transaction_unixtime
  const unixConfirmed = num(f[29]);
  const confirmedAt = unixConfirmed && unixConfirmed > 0 ? new Date(unixConfirmed * 1000) : null;
  const unixCreated = num(f[34]);
  const createdAt = unixCreated && unixCreated > 0 ? new Date(unixCreated * 1000) : new Date();

  // f[31] = transaction_referralpay
  const referralCommission = num(f[31]) ?? 0;

  await db.transaction.create({
    data: {
      userId: newUserId,
      type: newType,
      invoice,
      amount,
      status,
      paymentMethodType,
      paymentMethodTitle,
      paymentMethodSymbol,
      paymentMethodCurrency,
      walletAddress,
      accountNumber,
      accountName,
      bankName,
      routingNumber,
      depositProfit,
      referralCommission,
      profitTaken,
      confirmedAt,
      createdAt,
      updatedAt: createdAt,
    },
  });
  existingInvoices.add(invoice);
  txImported++;
}
console.log(`  Imported: ${txImported}  Skipped: ${txSkipped}\n`);

// ─── 3. Trades ────────────────────────────────────────────────────────────────

console.log('Importing trades...');

// Build instrument lookup: 'SOURCE_TARGET' → id
const instruments = await db.instrument.findMany({ select: { id: true, source: true, target: true } });
const instrMap = new Map(instruments.map(i => [`${i.source}_${i.target}`, i.id]));
// Alias: old S&P500 (source='S&P500', target='') → new SPX/500
const spxId = instrMap.get('SPX_500');
if (spxId) instrMap.set('S&P500_', spxId);

const tradeRows = parseTable('trade');
let tradeImported = 0, tradeSkipped = 0;

for (const f of tradeRows) {
  // f[1] = user_id, f[2] = user_id_copied
  const oldUserId = parseInt(unq(f[1]));
  if (!oldUserId) { tradeSkipped++; continue; }

  const newUserId = oldToNew.get(oldUserId);
  if (!newUserId) { tradeSkipped++; continue; }

  // f[4] = trade_instrument_source, f[5] = trade_instrument_target
  const source = unq(f[4]) || '';
  const target = unq(f[5]) || '';
  const instrumentId = instrMap.get(`${source}_${target}`);
  if (!instrumentId) {
    console.log(`  WARN  unmapped instrument ${source}/${target} (trade user=${oldUserId})`);
    tradeSkipped++;
    continue;
  }

  // f[6] = trade_logsize → leverage (Int, min 1)
  const leverage = Math.max(1, Math.round(num(f[6]) ?? 1));

  // f[7] = trade_openingtime, f[8] = trade_closingtime (Unix epoch seconds)
  const openUnix  = num(f[7]);
  const closeUnix = num(f[8]);
  const openingTime = openUnix  && openUnix  > 0 ? new Date(openUnix  * 1000) : new Date();
  const closingTime = closeUnix && closeUnix > 0 ? new Date(closeUnix * 1000) : null;

  // f[9] = openingprice, f[10] = closingprice, f[11] = position, f[12] = margin
  const openingPrice = num(f[9])  ?? 0;
  const closingPrice = num(f[10]);
  const position     = unq(f[11]) || 'long';
  const margin       = num(f[12]) ?? 0;

  // f[25] = trade_profit, f[26] = trade_profittaken
  const profit      = num(f[25]);
  const profitTaken = unq(f[26]) === 'yes';

  await db.trade.create({
    data: {
      userId: newUserId,
      instrumentId,
      sourceSymbol: source,
      targetSymbol: target,
      position,
      leverage,
      openingPrice,
      closingPrice,
      openingTime,
      closingTime,
      margin,
      profit,
      profitTaken,
    },
  });
  tradeImported++;
}
console.log(`  Imported: ${tradeImported}  Skipped: ${tradeSkipped}\n`);

console.log('Done.');
await db.$disconnect();
