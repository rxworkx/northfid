/**
 * Import normal users from the old pipnova_old MySQL dump.
 * Run: node prisma/import-users.mjs
 *
 * Users are imported with:
 * - mustResetPassword = true
 * - passwordResetToken = random UUID (valid for 30 days)
 * - An invalid password hash (they must use their reset link to set a new password)
 */

import { readFileSync } from 'fs';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const db = new PrismaClient();
const sql = readFileSync('c:/Users/Carters/php-docs/pipnova_old/unitzelc_pipnova.sql', 'utf8');

function parseFields(row) {
  const fields = [];
  let current = '';
  let inQuote = false;
  const start = row.startsWith('(') ? 1 : 0;
  for (let c = start; c < row.length; c++) {
    const ch = row[c];
    if (ch === "'") { inQuote = !inQuote; current += ch; }
    else if (ch === ',' && !inQuote) { fields.push(current.trim()); current = ''; }
    else { current += ch; }
  }
  fields.push(current.trim());
  return fields;
}

function unquote(s) {
  if (!s || s === 'NULL') return null;
  return s.replace(/^'|'$/g, '').trim();
}

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').substring(0, 30);
}

const userInsertRegex = /INSERT INTO `user`[^;]+;/gs;
const matches = [...sql.matchAll(userInsertRegex)];

const usersToImport = [];

for (const match of matches) {
  const block = match[0];
  const rows = block.split(/\),\s*\n\(/);
  for (const row of rows) {
    const idMatch = row.match(/^\(?(\d+),/);
    if (!idMatch) continue;
    const id = parseInt(idMatch[1]);
    const f = parseFields(row);

    // Skip copy traders (user_copytrader = 'yes' at field 38)
    if (unquote(f[38]) === 'yes') continue;

    const firstName = unquote(f[5]) || '';
    const lastName  = unquote(f[6]) || '';
    const email     = unquote(f[7]);
    const country   = (unquote(f[17]) || '').replace(/_/g, ' ');

    // Copy trader profile stats — skip if any are set
    const hasCopyStats = [f[41],f[42],f[43],f[44],f[45],f[46],f[47],f[48],f[49],f[50]]
      .some(v => v && v !== 'NULL' && v !== '0' && v !== "''");
    if (hasCopyStats) continue;

    if (!email) continue;

    usersToImport.push({ oldId: id, firstName, lastName, email, country });
  }
}

console.log(`Found ${usersToImport.length} users to import.\n`);

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

let imported = 0;
let skipped = 0;

for (const u of usersToImport) {
  // Check if email already exists
  const existing = await db.user.findUnique({ where: { email: u.email }, select: { id: true } });
  if (existing) {
    console.log(`  SKIP  ${u.email} (already exists)`);
    skipped++;
    continue;
  }

  const resetToken = randomUUID();
  const usernameBase = slug(`${u.firstName} ${u.lastName}`) || `user_${u.oldId}`;
  // Ensure unique username
  let username = usernameBase;
  let suffix = 1;
  while (await db.user.findUnique({ where: { username }, select: { id: true } })) {
    username = `${usernameBase}_${suffix++}`;
  }

  await db.user.create({
    data: {
      username,
      email: u.email,
      password: 'MUST_RESET', // invalid hash — login impossible until reset
      firstName: u.firstName || 'User',
      lastName: u.lastName || '',
      country: u.country,
      emailVerified: false,
      referralCode: `imp-${u.oldId}`,
      mustResetPassword: true,
      passwordResetToken: resetToken,
      passwordResetExpiry: expiry,
      platformDate: new Date('2020-01-01'),
      status: 'active',
    },
  });

  const resetUrl = `${BASE_URL}/reset-password?token=${resetToken}`;
  console.log(`  OK    ${(u.firstName + ' ' + u.lastName).padEnd(35)} ${u.email.padEnd(42)} ${resetUrl}`);
  imported++;
}

console.log(`\nDone. Imported: ${imported}  Skipped: ${skipped}`);
await db.$disconnect();
