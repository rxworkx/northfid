import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import { config as loadEnv } from "dotenv";
import { existsSync } from "fs";

if (existsSync(".env.production")) loadEnv({ path: ".env.production", override: true });
else loadEnv({ override: true });

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" });
const db = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Settings
  await db.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      minimumDeposit: 100,
      maximumDeposit: 100000,
      minimumWithdrawal: 50,
      maximumWithdrawal: 50000,
      referralCommission: 5,
      allowFundFromBalance: true,
    },
  });

  // Payment methods
  // priceSymbol = CoinGecko coin ID for crypto (used by /api/prices/update)
  // Leave priceSymbol null for fiat / bank transfer, they won't be touched by price updater
  const pms = [
    { title: "Bitcoin", type: "crypto", symbol: "BTC", currency: "USD", exchangeRate: 65000, walletAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", forDeposit: true, forWithdrawal: true, livePriceEnabled: true, priceSymbol: "bitcoin", orderIndex: 1 },
    { title: "Ethereum", type: "crypto", symbol: "ETH", currency: "USD", exchangeRate: 3200, walletAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", forDeposit: true, forWithdrawal: true, livePriceEnabled: true, priceSymbol: "ethereum", orderIndex: 2 },
    { title: "USDT (TRC-20)", type: "crypto", symbol: "USDT", currency: "USD", exchangeRate: 1.0, walletAddress: "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE", forDeposit: true, forWithdrawal: true, livePriceEnabled: false, priceSymbol: null, orderIndex: 3 },
    { title: "Bank Transfer", type: "bank_transfer", symbol: null, currency: "USD", exchangeRate: 1.0, bankName: "Chase Bank", accountName: "Northfid Group AG", accountNumber: "1234567890", routingNumber: "021000021", forDeposit: true, forWithdrawal: true, livePriceEnabled: false, priceSymbol: null, orderIndex: 4 },
    { title: "Fund from Balance", type: "balance", symbol: null, currency: "USD", exchangeRate: 1.0, forDeposit: true, forWithdrawal: false, livePriceEnabled: false, priceSymbol: null, orderIndex: 5 },
  ];

  for (const pm of pms) {
    await db.paymentMethod.upsert({
      where: { id: `seed-pm-${pm.orderIndex}` },
      update: pm,
      create: { id: `seed-pm-${pm.orderIndex}`, ...pm },
    });
  }

  // Instruments
  // priceSymbol = CoinGecko coin ID for crypto pairs
  // Forex pairs (EUR/USD etc) are not on CoinGecko, leave priceSymbol null, set bidPrice/askPrice manually
  const instruments = [
    { source: "BTC", target: "USD", livePriceEnabled: true, priceSymbol: "bitcoin", bidPrice: 64987, askPrice: 65013 },
    { source: "ETH", target: "USD", livePriceEnabled: true, priceSymbol: "ethereum", bidPrice: 3198, askPrice: 3202 },
    { source: "BNB", target: "USD", livePriceEnabled: true, priceSymbol: "binancecoin", bidPrice: 589, askPrice: 591 },
    { source: "SOL", target: "USD", livePriceEnabled: true, priceSymbol: "solana", bidPrice: 171, askPrice: 172 },
    { source: "XRP", target: "USD", livePriceEnabled: true, priceSymbol: "ripple", bidPrice: 0.591, askPrice: 0.593 },
    { source: "EUR", target: "USD", livePriceEnabled: false, priceSymbol: null, bidPrice: 1.0853, askPrice: 1.0857 },
    { source: "GBP", target: "USD", livePriceEnabled: false, priceSymbol: null, bidPrice: 1.2701, askPrice: 1.2705 },
    { source: "JPY", target: "USD", livePriceEnabled: false, priceSymbol: null, bidPrice: 0.00641, askPrice: 0.00643 },
    { source: "GOLD", target: "USD", livePriceEnabled: false, priceSymbol: null, bidPrice: 2312, askPrice: 2314 },
    { source: "OIL", target: "USD", livePriceEnabled: false, priceSymbol: null, bidPrice: 79.4, askPrice: 79.6 },
  ];

  for (const inst of instruments) {
    await db.instrument.upsert({
      where: { source_target: { source: inst.source, target: inst.target } },
      update: inst,
      create: inst,
    });
  }

  // This file is in the repo, so production must never get its default password
  // or the demo account. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to seed it,
  // and optionally SEED_ADMIN_USERNAME for the name to log in with.
  const isProduction = process.env.NODE_ENV === "production";
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const adminUsername = process.env.SEED_ADMIN_USERNAME ?? "admin";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "12345678";
  if (isProduction && (!process.env.SEED_ADMIN_EMAIL || !process.env.SEED_ADMIN_PASSWORD || adminPassword.length < 12)) {
    throw new Error("In production, set SEED_ADMIN_EMAIL and a SEED_ADMIN_PASSWORD of at least 12 characters.");
  }

  // Demo user
  if (!isProduction) {
    const hashedPass = await bcrypt.hash("12345678", 12);
    await db.user.upsert({
      where: { email: "demo@example.com" },
      update: { username: "demo", password: hashedPass },
      create: {
        username: "demo",
        email: "demo@example.com",
        password: hashedPass,
        firstName: "Demo",
        lastName: "User",
        country: "United States",
        referralCode: "DEMO0001",
        emailVerified: true,
      },
    });

    // Demo user wallet
    const demoUser = await db.user.findUnique({ where: { email: "demo@example.com" }, select: { id: true } });
    if (demoUser) {
      await db.wallet.upsert({
        where: { userId: demoUser.id },
        update: {},
        create: { userId: demoUser.id, balance: 5000 },
      });
    }
  }

  // Admin account
  const adminPass = await bcrypt.hash(adminPassword, 12);
  await db.user.upsert({
    where: { email: adminEmail },
    update: { username: adminUsername, password: adminPass },
    create: {
      username: adminUsername,
      email: adminEmail,
      password: adminPass,
      firstName: "Admin",
      lastName: "User",
      country: "United States",
      referralCode: "ADMN0001",
      emailVerified: true,
      role: "admin",
    },
  });

  // Standalone copy trader profile (no linked user account)
  await db.copyTrader.upsert({
    where: { id: "seed-trader-michael-chen" },
    update: {},
    create: {
      id: "seed-trader-michael-chen",
      firstName: "Michael",
      lastName: "Chen",
      country: "United Kingdom",
      sn: 10,
      profitRate7d: 12.4,
      profitRate30d: 38.7,
      profitRate90d: 97.2,
      cumulativePnl: 142580,
      maxDrawdown: 8.3,
      profitShareRatio: 20,
      copiersCount: 247,
      copiersEarnings: 28450,
      accountInstruments: 12,
    },
  });

  // Academy articles, clean slate on every re-seed
  await (db as any).academyArticle.deleteMany({ where: { id: { startsWith: "seed-academy-" } } });
  const academyArticles = [
    {
      title: "Introduction to Trading",
      description: "Learn the basics of financial markets, how prices move, and the first steps every new trader should take before risking real money.",
      category: "Beginners",
      orderIndex: 1,
      thumbnail: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
      content: `
<h2>What Is Trading?</h2>
<p>Trading is the act of buying and selling financial instruments, such as currencies, stocks, commodities, or cryptocurrencies, with the goal of generating a profit from price movements. Unlike investing, which typically involves holding assets for years, trading focuses on shorter-term price changes, sometimes lasting minutes, hours, or days.</p>
<p>Financial markets provide a structured environment where buyers and sellers meet to exchange assets at agreed prices. Prices are driven by supply and demand: when more people want to buy than sell, prices rise; when more want to sell than buy, prices fall.</p>

<h2>Types of Financial Markets</h2>
<ul>
<li><strong>Forex (Foreign Exchange):</strong> The largest and most liquid market in the world, where currencies are traded in pairs, for example, EUR/USD or GBP/JPY. It operates 24 hours a day, five days a week.</li>
<li><strong>Stock Markets:</strong> Platforms where shares of publicly listed companies are bought and sold. Examples include the NYSE, NASDAQ, and London Stock Exchange.</li>
<li><strong>Commodities:</strong> Physical goods like gold, silver, oil, and agricultural products traded on exchanges or via derivatives.</li>
<li><strong>Cryptocurrencies:</strong> Digital assets like Bitcoin and Ethereum traded on crypto exchanges around the clock, 365 days a year.</li>
</ul>

<h2>How Prices Move</h2>
<p>Prices respond to a constant flow of information. Economic data releases (like jobs reports or inflation figures), central bank decisions, geopolitical events, and even social media sentiment can all cause rapid price movements. Understanding what drives price action in your chosen market is a foundational skill.</p>
<p>Two primary approaches are used to analyse price movements:</p>
<ul>
<li><strong>Fundamental Analysis:</strong> Evaluating the underlying economic, financial, and qualitative factors that affect an asset's true value.</li>
<li><strong>Technical Analysis:</strong> Studying historical price charts and patterns to forecast future price behaviour.</li>
</ul>

<h2>Key Concepts Every Beginner Must Know</h2>
<ul>
<li><strong>Leverage:</strong> Allows you to control a large position with a small deposit. While leverage amplifies profits, it equally amplifies losses. Use it carefully.</li>
<li><strong>Margin:</strong> The amount of capital required in your account to open and maintain a leveraged position.</li>
<li><strong>Spread:</strong> The difference between the buy (ask) and sell (bid) price, this is effectively the broker's fee on each trade.</li>
<li><strong>Pip:</strong> The smallest standard price movement in forex, usually the fourth decimal place (e.g. 0.0001).</li>
<li><strong>Stop Loss:</strong> An order that automatically closes your trade if the price moves against you by a set amount, capping your potential loss.</li>
<li><strong>Take Profit:</strong> An order that automatically closes your trade when a target profit level is reached.</li>
</ul>

<h2>Steps to Get Started</h2>
<ol>
<li><strong>Educate yourself first.</strong> Read, watch tutorials, and study the market you want to trade. Never trade with real money before understanding the basics.</li>
<li><strong>Choose a market.</strong> Start with one market, forex or crypto are popular for beginners due to low barriers to entry.</li>
<li><strong>Practice on a demo account.</strong> Most brokers offer paper-trading environments with virtual funds. Use this to build confidence without financial risk.</li>
<li><strong>Define your risk tolerance.</strong> Decide how much of your capital you are willing to risk per trade (most professionals use 1–2%).</li>
<li><strong>Develop a trading plan.</strong> A plan covers your strategy, entry/exit rules, risk management, and trading schedule.</li>
<li><strong>Start small.</strong> When going live, trade the minimum position sizes until you build a consistent track record.</li>
</ol>

<h2>The Mindset of a Successful Trader</h2>
<p>Most new traders focus almost exclusively on entries, finding the "perfect" time to buy or sell. But professional traders know that risk management and psychological discipline matter far more. A strategy with a modest win rate can still be highly profitable if the average winner is larger than the average loser.</p>
<p>Patience, consistency, and a willingness to learn from every trade are what separate profitable traders from the majority who lose money. Trading is a long-term skill, treat it like a craft you are building over time.</p>
      `.trim(),
    },
    {
      title: "Understanding Forex Markets",
      description: "A deep dive into currency pairs, pips, lots, market sessions, and how the world's largest financial market actually works.",
      category: "Forex",
      orderIndex: 1,
      thumbnail: "https://images.unsplash.com/photo-1640340434855-6084b1f4901c?auto=format&fit=crop&w=1200&q=80",
      content: `
<h2>What Is the Forex Market?</h2>
<p>The foreign exchange market, commonly known as forex or FX, is where currencies are bought, sold, and exchanged. With a daily trading volume exceeding <strong>$7.5 trillion</strong>, it is the most liquid and widely traded market on the planet. Unlike stock markets, forex has no centralised exchange; it operates through a global network of banks, financial institutions, corporations, and individual traders.</p>
<p>The forex market is open 24 hours a day, five days a week, spanning major financial centres across the globe: Sydney, Tokyo, London, and New York.</p>

<h2>Currency Pairs Explained</h2>
<p>In forex, currencies are always traded in pairs. When you buy one currency, you simultaneously sell another. A currency pair is written as BASE/QUOTE, for example, EUR/USD.</p>
<ul>
<li><strong>Base Currency:</strong> The first currency in the pair (EUR in EUR/USD). This is what you are buying or selling.</li>
<li><strong>Quote Currency:</strong> The second currency (USD in EUR/USD). This is the currency used to price the base.</li>
</ul>
<p>If EUR/USD is trading at 1.0850, it means 1 Euro costs 1.0850 US Dollars.</p>
<p>Currency pairs are divided into three categories:</p>
<ul>
<li><strong>Major Pairs:</strong> The most traded pairs, all involving the USD, EUR/USD, GBP/USD, USD/JPY, USD/CHF, AUD/USD, USD/CAD, NZD/USD. These have the tightest spreads and highest liquidity.</li>
<li><strong>Minor Pairs (Cross Pairs):</strong> Pairs that do not include the USD, EUR/GBP, EUR/JPY, GBP/JPY. Slightly wider spreads than majors.</li>
<li><strong>Exotic Pairs:</strong> One major currency paired with a currency from an emerging economy, USD/TRY, EUR/ZAR. Higher spreads and volatility.</li>
</ul>

<h2>Pips, Lots, and Position Sizing</h2>
<p>A <strong>pip</strong> (percentage in point) is the smallest standard price movement in a currency pair. For most pairs, this is 0.0001 (the fourth decimal place). For JPY pairs, it is 0.01 (the second decimal place).</p>
<p>A <strong>lot</strong> defines the size of your trade:</p>
<ul>
<li><strong>Standard Lot:</strong> 100,000 units of the base currency</li>
<li><strong>Mini Lot:</strong> 10,000 units</li>
<li><strong>Micro Lot:</strong> 1,000 units</li>
</ul>
<p>For a standard EUR/USD trade, one pip is worth approximately $10. For a micro lot, it is $0.10. Understanding pip value is essential for calculating risk.</p>

<h2>Market Sessions and Best Trading Times</h2>
<p>The forex market operates across four major trading sessions:</p>
<ul>
<li><strong>Sydney Session:</strong> 10:00 PM – 7:00 AM UTC. Relatively quiet; Australian and New Zealand dollar pairs are most active.</li>
<li><strong>Tokyo Session:</strong> 12:00 AM – 9:00 AM UTC. JPY pairs, AUD/USD, and NZD/USD see increased activity.</li>
<li><strong>London Session:</strong> 8:00 AM – 5:00 PM UTC. The most active session, accounting for ~35% of all forex transactions. EUR, GBP, and CHF pairs are most active.</li>
<li><strong>New York Session:</strong> 1:00 PM – 10:00 PM UTC. High volume, especially during the London–New York overlap (1:00 PM – 5:00 PM UTC), which produces the largest price moves.</li>
</ul>
<p>The <strong>London–New York overlap</strong> is the most volatile and liquid period of the trading day, ideal for day traders seeking volatility and tight spreads.</p>

<h2>What Moves Forex Prices?</h2>
<p>Currency prices are driven by a combination of macroeconomic and geopolitical forces:</p>
<ul>
<li><strong>Interest Rates:</strong> The most powerful driver. When a central bank raises rates, its currency typically strengthens as investors seek higher yields.</li>
<li><strong>Inflation Data:</strong> Higher inflation often leads to interest rate hikes, influencing currency direction.</li>
<li><strong>Economic Growth (GDP):</strong> A strong economy attracts foreign investment, increasing demand for its currency.</li>
<li><strong>Employment Data:</strong> Reports like the US Non-Farm Payrolls (NFP) cause some of the biggest single-day moves in forex.</li>
<li><strong>Political Stability:</strong> Geopolitical uncertainty causes traders to flee riskier currencies in favour of safe havens like USD, CHF, and JPY.</li>
</ul>

<h2>Reading a Forex Quote</h2>
<p>Every forex quote shows two prices, the <strong>bid</strong> (price to sell) and the <strong>ask</strong> (price to buy). The difference between them is the <strong>spread</strong>, which is the broker's primary source of revenue.</p>
<p>Example: EUR/USD quoted at <strong>1.0852 / 1.0854</strong>, the spread is 2 pips. If you buy at 1.0854, the price must rise above 1.0854 before you profit.</p>
      `.trim(),
    },
    {
      title: "Copy Trading Explained",
      description: "Learn how copy trading works, how to evaluate traders worth copying, and how to protect your capital while building passive income.",
      category: "Copy Trading",
      orderIndex: 1,
      thumbnail: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80",
      content: `
<h2>What Is Copy Trading?</h2>
<p>Copy trading is a form of social trading that allows you to automatically replicate the trades of experienced investors in real time. When a trader you are copying opens, modifies, or closes a position, the same action is mirrored in your account, proportionally scaled to your allocated capital.</p>
<p>It bridges the gap between complete beginners and the complex world of active trading, offering a way to participate in financial markets without needing deep technical knowledge or constant screen time.</p>

<h2>How Copy Trading Works</h2>
<ol>
<li><strong>Browse expert traders.</strong> Review their performance statistics, profit rates, drawdown, number of copiers, instruments traded, and trading history.</li>
<li><strong>Allocate capital.</strong> Decide how much of your portfolio to allocate to copying a specific trader. Many platforms allow you to copy multiple traders simultaneously to diversify.</li>
<li><strong>Trades are mirrored automatically.</strong> Every trade the expert opens is replicated in your account at the proportional size based on your allocated amount.</li>
<li><strong>Monitor and adjust.</strong> You can stop copying at any time, adjust your allocation, or set a maximum drawdown limit to auto-stop if losses reach a certain threshold.</li>
</ol>

<h2>Key Metrics to Evaluate Before Copying</h2>
<p>Not all profitable traders are worth copying. Here is what to look for:</p>
<ul>
<li><strong>Profit Rate (7D / 30D / 90D):</strong> Short-term rates can be misleading. Focus on the 30-day and 90-day figures for a more reliable picture.</li>
<li><strong>Maximum Drawdown:</strong> This is the largest peak-to-trough decline in a trader's account. A lower drawdown means the trader manages risk more carefully. Anything above 30% should prompt caution.</li>
<li><strong>Cumulative PnL:</strong> Total profit and loss over the trader's history. Consistency over time is more valuable than one exceptional month.</li>
<li><strong>Number of Copiers:</strong> A large, growing base of copiers is a signal of community trust, but do not use it as your only metric.</li>
<li><strong>Instruments Traded:</strong> Traders who specialise in a few instruments are often more focused and disciplined than those trading dozens simultaneously.</li>
<li><strong>Profit Share Ratio:</strong> The percentage of profits shared with the expert trader. Ensure this aligns with your expectations.</li>
</ul>

<h2>Benefits of Copy Trading</h2>
<ul>
<li><strong>No experience required:</strong> Beginners can participate in markets immediately without years of study.</li>
<li><strong>Passive income potential:</strong> Once set up, your account trades automatically without requiring active involvement.</li>
<li><strong>Learning by observation:</strong> Watching the trades of successful traders is an educational experience in itself.</li>
<li><strong>Diversification:</strong> Copying multiple traders across different strategies and asset classes spreads risk across your portfolio.</li>
</ul>

<h2>Risks You Must Understand</h2>
<p>Copy trading does not eliminate risk, it transfers part of the decision-making. All trading involves the possibility of losing money, and past performance of a trader does not guarantee future results.</p>
<ul>
<li>A trader's strategy may stop working due to changing market conditions.</li>
<li>Drawdown periods can be emotionally difficult, especially for risk-averse investors.</li>
<li>Over-allocating to a single trader concentrates your risk dangerously.</li>
</ul>

<h2>Best Practices</h2>
<ul>
<li>Diversify across 3–5 traders with different styles and markets.</li>
<li>Never allocate more to copy trading than you can afford to lose.</li>
<li>Set a maximum drawdown limit per trader, stop copying automatically if losses exceed 15–20%.</li>
<li>Review your copied traders monthly and remove any who show consistent underperformance.</li>
<li>Treat copy trading as one component of a diversified financial strategy, not your only source of returns.</li>
</ul>
      `.trim(),
    },
    {
      title: "Risk Management Fundamentals",
      description: "Protect your trading capital with proven techniques used by professional traders, position sizing, stop losses, and the risk/reward ratio.",
      category: "Risk Management",
      orderIndex: 1,
      thumbnail: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80",
      content: `
<h2>Why Risk Management Is the Foundation of Trading</h2>
<p>Many new traders obsess over finding the "perfect" entry strategy. Professionals know that <strong>how you manage risk</strong> determines whether you survive long enough to be profitable. A trader with a 40% win rate can still be highly profitable, if their winners are consistently larger than their losers.</p>
<p>The primary goal of risk management is capital preservation. You cannot profit from the market if you have blown your account. Protecting your downside ensures you are always in the game.</p>

<h2>The 1% Rule</h2>
<p>The single most important rule in risk management: <strong>never risk more than 1–2% of your total trading capital on a single trade.</strong></p>
<p>If your account is $10,000, your maximum loss per trade should be $100–$200. This means a losing streak of 10 consecutive trades only reduces your account by 10–20%, painful, but recoverable. Without this rule, a losing streak can wipe out an account entirely.</p>

<h2>Position Sizing</h2>
<p>Position sizing determines how large a trade you open based on your risk tolerance. The formula is straightforward:</p>
<blockquote>Position Size = (Account Balance × Risk %) ÷ Stop Loss in Pips × Pip Value</blockquote>
<p>For example: $10,000 account, 1% risk ($100), 50-pip stop loss, $1 pip value = 2 mini lots.</p>
<p>Never let the size of a potential profit tempt you into oversizing a position. Consistency in position sizing is a hallmark of professional trading.</p>

<h2>Stop Losses: Non-Negotiable</h2>
<p>A stop loss is a pre-defined price level at which your trade is automatically closed to prevent further loss. <strong>Every trade should have a stop loss.</strong> No exceptions.</p>
<p>Where to place your stop loss:</p>
<ul>
<li><strong>Below a support level</strong> for long (buy) trades</li>
<li><strong>Above a resistance level</strong> for short (sell) trades</li>
<li>Beyond a recent swing high or low</li>
<li>Based on Average True Range (ATR), placing the stop at 1.5–2× the ATR away from entry</li>
</ul>
<p>Avoid placing stops at round numbers (e.g. exactly at 1.0800) as these are common targets for stop-hunting by institutional traders.</p>

<h2>The Risk/Reward Ratio</h2>
<p>The risk/reward ratio (R:R) compares the potential profit of a trade to the potential loss. A 1:2 R:R means you risk $100 to make $200.</p>
<p>With a 1:2 R:R, you only need to win 34% of your trades to break even. At a 1:3 R:R, you only need to win 25%. This is why even strategies with modest win rates can be profitable when the reward is consistently larger than the risk.</p>
<p><strong>Aim for a minimum 1:2 risk/reward on every trade.</strong> Avoid taking trades where the potential profit is less than the potential loss.</p>

<h2>Drawdown Management</h2>
<p>Drawdown is the peak-to-trough decline of your account over a period of time. All traders experience drawdowns, what matters is controlling their depth.</p>
<ul>
<li><strong>Maximum drawdown under 20%</strong> is generally considered disciplined trading.</li>
<li>If you reach a 10% drawdown, reduce your position sizes by 50% until you recover.</li>
<li>If you hit 20%, stop trading, review your strategy, and only return to markets with a clear plan.</li>
</ul>

<h2>Diversification</h2>
<p>Do not concentrate all your capital in a single trade, instrument, or market. Spreading risk across uncorrelated assets means a loss in one position does not devastate your entire portfolio.</p>
<p>However, beware of <strong>false diversification</strong>, holding many currency pairs that all move together (e.g. EUR/USD and AUD/USD during a broad USD rally) does not actually reduce your overall risk.</p>

<h2>The Golden Rules</h2>
<ul>
<li>Never risk more than 1–2% per trade</li>
<li>Always set a stop loss before entering a trade</li>
<li>Aim for at least a 1:2 risk/reward ratio</li>
<li>Reduce position sizes during drawdown periods</li>
<li>Never add to a losing position to "average down"</li>
<li>Keep a trading journal and review it regularly</li>
</ul>
      `.trim(),
    },
    {
      title: "Technical Analysis Basics",
      description: "Learn to read price charts, identify key candlestick patterns, draw support and resistance levels, and use moving averages and momentum indicators.",
      category: "Technical Analysis",
      orderIndex: 1,
      thumbnail: "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=1200&q=80",
      content: `
<h2>What Is Technical Analysis?</h2>
<p>Technical analysis (TA) is the study of historical price data, primarily through charts, to identify patterns and forecast future price movements. Unlike fundamental analysis, which focuses on economic data and company financials, TA is based on the premise that <strong>all known information is already reflected in the price</strong>, and that price tends to move in recognisable, repeating patterns.</p>
<p>Technical analysis is used across all financial markets, forex, stocks, crypto, and commodities, and across all timeframes, from 1-minute scalping charts to monthly position trading charts.</p>

<h2>Candlestick Charts</h2>
<p>The candlestick chart is the most popular chart type among traders. Each candle represents price movement over a defined period (e.g. 1 hour, 1 day) and shows four key data points: <strong>Open, High, Low, Close (OHLC)</strong>.</p>
<ul>
<li><strong>Bullish candle (green/white):</strong> Close is higher than Open, buyers were in control during this period.</li>
<li><strong>Bearish candle (red/black):</strong> Close is lower than Open, sellers were in control.</li>
<li><strong>Wicks (shadows):</strong> The thin lines above and below the body represent the High and Low of the period.</li>
</ul>
<p>Key candlestick patterns to learn:</p>
<ul>
<li><strong>Doji:</strong> Open and close are nearly equal, showing market indecision, often a reversal signal.</li>
<li><strong>Hammer / Pin Bar:</strong> Long lower wick with small body, signals potential bullish reversal from a low.</li>
<li><strong>Engulfing:</strong> A large candle that fully "engulfs" the previous candle, a strong reversal signal.</li>
<li><strong>Morning Star / Evening Star:</strong> Three-candle reversal patterns indicating a trend change.</li>
</ul>

<h2>Support and Resistance</h2>
<p>Support and resistance are arguably the most important concepts in technical analysis.</p>
<ul>
<li><strong>Support:</strong> A price level where buying interest is strong enough to prevent the price from falling further. Think of it as a "floor."</li>
<li><strong>Resistance:</strong> A price level where selling pressure is strong enough to prevent the price from rising further. Think of it as a "ceiling."</li>
</ul>
<p>When price breaks through a resistance level with strong momentum, that resistance often becomes new support (and vice versa). This concept is called <strong>role reversal</strong>.</p>
<p>Support and resistance levels are found at: previous swing highs and lows, round numbers (e.g. 1.1000, 50,000), and areas where price has repeatedly reversed in the past.</p>

<h2>Trend Lines and Market Structure</h2>
<p>Markets move in three directions: up (uptrend), down (downtrend), or sideways (range). Identifying the prevailing trend is the first step in any technical analysis.</p>
<ul>
<li><strong>Uptrend:</strong> Higher highs and higher lows. Draw the trend line connecting the swing lows.</li>
<li><strong>Downtrend:</strong> Lower highs and lower lows. Draw the trend line connecting the swing highs.</li>
<li><strong>Range:</strong> Price oscillates between defined support and resistance levels.</li>
</ul>
<p>The classic principle: <strong>"The trend is your friend."</strong> Trading in the direction of the trend significantly improves your probability of success.</p>

<h2>Moving Averages</h2>
<p>A moving average (MA) smooths out price data to help identify trend direction.</p>
<ul>
<li><strong>Simple Moving Average (SMA):</strong> Average of the last N closing prices. The 50 SMA and 200 SMA are widely watched on daily charts.</li>
<li><strong>Exponential Moving Average (EMA):</strong> Gives more weight to recent prices, making it more responsive to current conditions. The 20 EMA is popular for short-term trend following.</li>
</ul>
<p>When price is above the 200 SMA, the market is considered in a long-term uptrend. A "Golden Cross" (50 SMA crossing above 200 SMA) is a classic bullish signal; a "Death Cross" is bearish.</p>

<h2>Key Momentum Indicators</h2>
<ul>
<li><strong>RSI (Relative Strength Index):</strong> Oscillates between 0–100. Above 70 is considered "overbought" (potential sell signal); below 30 is "oversold" (potential buy signal). Best used to confirm, not predict.</li>
<li><strong>MACD (Moving Average Convergence Divergence):</strong> Shows the relationship between two EMAs. A crossover of the MACD line above the signal line is a bullish signal; below is bearish.</li>
<li><strong>Bollinger Bands:</strong> A volatility indicator that plots two standard deviations above and below a moving average. Price touching the upper band may signal overbought conditions; the lower band may signal oversold.</li>
</ul>

<h2>Putting It All Together</h2>
<p>Effective technical analysis combines multiple confluences, you look for situations where the trend, support/resistance, candlestick pattern, and an indicator all align in the same direction. The more confluences agree, the higher the probability of a successful trade.</p>
<p>Start by mastering one or two concepts thoroughly before adding more tools to your analysis. Overloading your charts with indicators leads to confusion and paralysis.</p>
      `.trim(),
    },
    {
      title: "Trading Psychology",
      description: "Discover why most traders fail due to emotional decisions, and learn the mental disciplines, patience, consistency, and objectivity, that separate professionals from amateurs.",
      category: "Psychology",
      orderIndex: 1,
      thumbnail: "https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&w=1200&q=80",
      content: `
<h2>The Hidden Reason Most Traders Fail</h2>
<p>Studies consistently show that the majority of retail traders lose money. The reason is rarely a lack of strategy. Most failing traders have access to the same charts, indicators, and information as profitable ones. The difference is almost entirely psychological.</p>
<p>Emotions, primarily <strong>fear, greed, hope, and revenge</strong>, are the enemy of rational decision-making. A perfectly designed strategy delivers no edge if the trader abandons it at the first sign of a losing streak or doubles down after a big win out of overconfidence.</p>

<h2>The Two Most Dangerous Emotions</h2>
<p><strong>Fear</strong> manifests in multiple ways:</p>
<ul>
<li>Fear of missing out (FOMO), chasing trades that have already moved, entering late at the worst possible price.</li>
<li>Fear of losing, closing profitable trades too early because you are scared they will reverse.</li>
<li>Fear of being wrong, refusing to accept a loss and moving your stop loss further away, turning a small loss into a catastrophic one.</li>
</ul>
<p><strong>Greed</strong> is equally destructive:</p>
<ul>
<li>Over-leveraging positions to "make more" from a good-looking setup.</li>
<li>Moving take profit targets higher mid-trade, only to watch the price reverse and exit at break-even or a loss.</li>
<li>Trading too frequently, always needing to be in the market, even when no good setups exist.</li>
</ul>

<h2>Revenge Trading</h2>
<p>One of the most common and destructive behaviours in trading. After a significant loss, the emotional brain demands immediate recovery. The trader increases position sizes, abandons their strategy, and takes impulsive trades to "win back" what was lost.</p>
<p>The result is almost always a larger loss. Revenge trading is a cycle, and the exit is simple: when you take a loss that affects you emotionally, <strong>close your platform and stop trading for the day.</strong></p>

<h2>The Importance of a Trading Plan</h2>
<p>A written trading plan is your psychological anchor. It removes emotion from in-the-moment decisions by pre-defining the rules you follow before you are under pressure.</p>
<p>Your trading plan should specify:</p>
<ul>
<li>Which markets you trade and during which sessions</li>
<li>Your entry and exit criteria (specific, measurable rules, not vague)</li>
<li>Maximum risk per trade and per day</li>
<li>How many trades you take per day/week</li>
<li>What conditions cause you to stop trading (e.g. after 3 losses in a row)</li>
</ul>
<p>When you have a losing trade, the question should never be "should I have done that?", if you followed your plan, the answer is yes. If you did not follow your plan, the trade outcome is irrelevant, breaking your rules is the problem, not the result.</p>

<h2>Developing Discipline and Patience</h2>
<p>Professional traders do not trade because they are bored, or because the market is open, or because they "feel" like something is about to happen. They trade when their specific setup appears, and not before.</p>
<p>Patience in trading means:</p>
<ul>
<li>Waiting for high-probability setups that match all your criteria</li>
<li>Sitting on your hands when the market is unclear or choppy</li>
<li>Holding a winning trade until your predetermined exit rather than closing it early</li>
</ul>
<p>Discipline is executing your plan, every single time, regardless of how you feel. This is trained behaviour, not a personality trait. It takes months of deliberate practice to build.</p>

<h2>The Trading Journal</h2>
<p>Keeping a detailed trading journal is one of the most powerful habits you can develop. Record every trade with:</p>
<ul>
<li>Date, instrument, and direction (long/short)</li>
<li>Entry and exit prices, position size</li>
<li>The reason for taking the trade (which setup, which rules were met)</li>
<li>The outcome (profit/loss in pips and dollars)</li>
<li>Your emotional state before and during the trade</li>
<li>What you would do differently</li>
</ul>
<p>Reviewing your journal monthly reveals patterns you cannot see in the moment: times of day when you over-trade, markets where your strategy underperforms, emotional triggers that lead to bad decisions.</p>

<h2>Building a Healthy Trading Mindset</h2>
<ul>
<li><strong>Think in probabilities.</strong> No single trade matters. What matters is the outcome over the next 100 trades. A loss is just part of the distribution, not a failure.</li>
<li><strong>Detach from money.</strong> Think in terms of R (risk units) rather than dollars. Losing 1R is the same whether your account is $1,000 or $100,000.</li>
<li><strong>Celebrate process, not results.</strong> A trader who followed their plan perfectly on a losing trade made a better decision than one who broke their rules on a winning trade.</li>
<li><strong>Take breaks.</strong> Trading is mentally taxing. Rest, exercise, and sleep are not luxuries, they are part of your edge.</li>
<li><strong>Accept that you will lose.</strong> The goal is not to avoid all losses. The goal is to ensure your winners, over time, are larger than your losers.</li>
</ul>
      `.trim(),
    },
  ];

  for (const item of academyArticles) {
    const slug = item.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const id = `seed-academy-${slug}`;
    await (db as any).academyArticle.upsert({
      where: { id },
      update: item,
      create: { id, ...item },
    });
  }

  console.log("Seed complete.");
  console.log(`Admin login: ${adminUsername} or ${adminEmail}`);
  if (!isProduction) console.log("Demo login:  demo@example.com  / 12345678  (username: demo)");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
