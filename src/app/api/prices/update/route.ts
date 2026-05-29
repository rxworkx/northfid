import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Call with: POST /api/prices/update
// Protect with CRON_SECRET header so only your cron job can trigger it.
// If CRON_SECRET is not set in env, the endpoint is disabled.
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Price updates not configured" }, { status: 503 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [instruments, paymentMethods] = await Promise.all([
    db.instrument.findMany({
      where: { livePriceEnabled: true, priceSymbol: { not: null } },
      select: { id: true, priceSymbol: true },
    }),
    db.paymentMethod.findMany({
      where: { livePriceEnabled: true, priceSymbol: { not: null } },
      select: { id: true, priceSymbol: true },
    }),
  ]);

  // Collect unique CoinGecko coin IDs
  const symbolSet = new Set<string>();
  instruments.forEach((i) => i.priceSymbol && symbolSet.add(i.priceSymbol));
  paymentMethods.forEach((p) => p.priceSymbol && symbolSet.add(p.priceSymbol));

  if (symbolSet.size === 0) {
    return NextResponse.json({ updated: 0, skipped: 0, message: "Nothing to update" });
  }

  // Fetch prices from CoinGecko free API — no key required
  const ids = Array.from(symbolSet).join(",");
  let prices: Record<string, { usd: number }> = {};
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=usd`,
      { next: { revalidate: 0 }, signal: AbortSignal.timeout(10_000) }
    );
    if (!res.ok) throw new Error(`CoinGecko responded with ${res.status}`);
    prices = await res.json();
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch prices", detail: String(err) },
      { status: 502 }
    );
  }

  let updated = 0;
  let skipped = 0;
  const now = new Date();

  // Update instruments — apply a small symmetric spread (0.02%)
  const SPREAD = 0.0002;
  await Promise.all(
    instruments.map(async (inst) => {
      const coinPrice = prices[inst.priceSymbol!]?.usd;
      if (!coinPrice) { skipped++; return; }
      await db.instrument.update({
        where: { id: inst.id },
        data: {
          bidPrice: coinPrice * (1 - SPREAD),
          askPrice: coinPrice * (1 + SPREAD),
          priceUpdatedAt: now,
        },
      });
      updated++;
    })
  );

  // Update payment methods — exchangeRate = USD value of 1 unit of the coin
  await Promise.all(
    paymentMethods.map(async (pm) => {
      const coinPrice = prices[pm.priceSymbol!]?.usd;
      if (!coinPrice) { skipped++; return; }
      await db.paymentMethod.update({
        where: { id: pm.id },
        data: { exchangeRate: coinPrice },
      });
      updated++;
    })
  );

  return NextResponse.json({ updated, skipped, updatedAt: now.toISOString() });
}
