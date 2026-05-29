import { readFileSync } from 'fs';

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

const userInsertRegex = /INSERT INTO `user`[^;]+;/gs;
const matches = [...sql.matchAll(userInsertRegex)];

const normalUsers = [];
for (const match of matches) {
  const block = match[0];
  const rows = block.split(/\),\s*\n\(/);
  for (const row of rows) {
    const idMatch = row.match(/^\(?(\d+),/);
    if (!idMatch) continue;
    const id = parseInt(idMatch[1]);
    const f = parseFields(row);

    // user_copytrader is field index 38 — 'yes' means copy trader, skip them
    const isCopyTrader = unquote(f[38]) === 'yes';
    if (isCopyTrader) continue;
    const firstName       = unquote(f[5]) || '';
    const lastName        = unquote(f[6]) || '';
    const email           = unquote(f[7]);
    const country         = (unquote(f[17]) || '').replace(/_/g, ' ');
    const walletBalance   = parseFloat(f[10]) || 0;
    const lastDeposit     = parseFloat(f[12]) || 0;
    const copyTradersAdded = unquote(f[37]); // IDs of traders they were copying
    // copy trader profile stats
    const copiersCount  = parseFloat(f[41]) || 0;
    const instruments   = parseFloat(f[42]) || 0;
    const pnl           = parseFloat(f[43]) || 0;
    const earnings      = parseFloat(f[44]) || 0;
    const drawdown      = parseFloat(f[45]) || 0;
    const platformDate  = unquote(f[46]);
    const profitShare   = parseFloat(f[47]) || 0;
    const rate7d        = parseFloat(f[48]) || 0;
    const rate30d       = parseFloat(f[49]) || 0;
    const rate90d       = parseFloat(f[50]) || 0;

    const hasCopyTraderStats = copiersCount || instruments || pnl || earnings || drawdown || platformDate || profitShare || rate7d || rate30d || rate90d;
    if (hasCopyTraderStats) continue;
    if (!email) continue;

    normalUsers.push({ id, firstName, lastName, email, country, walletBalance, lastDeposit, copyTradersAdded });
  }
}

console.log(`Normal users (not copy traders): ${normalUsers.length}\n`);
normalUsers.forEach(u => {
  const name    = `${u.firstName} ${u.lastName}`.trim().padEnd(32);
  const em      = (u.email || '').padEnd(40);
  const balance = `bal:$${u.walletBalance.toLocaleString()}`.padEnd(18);
  const copying = u.copyTradersAdded ? `copying:[${u.copyTradersAdded}]` : 'not copying';
  console.log(`  ID:${String(u.id).padEnd(5)} ${name} ${em} ${balance} ${copying}`);
});
