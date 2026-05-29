import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

const navPages = [
  { label: "Discover", href: "/dashboard" },
  { label: "Fund Account", href: "/dashboard/fund-account" },
  { label: "Manage Funds", href: "/dashboard/fund-portfolio" },
  { label: "Withdraw", href: "/dashboard/withdraw" },
  { label: "Transactions", href: "/dashboard/transactions" },
  { label: "My Trades", href: "/dashboard/trades" },
  { label: "Expert Traders", href: "/dashboard/expert-traders" },
  { label: "My Copied Traders", href: "/dashboard/my-expert-traders" },
  { label: "Instruments", href: "/dashboard/instruments" },
  { label: "Market Buzz", href: "/dashboard/market-buzz" },
  { label: "Economic Calendar", href: "/dashboard/economic-calendar" },
  { label: "Academy", href: "/dashboard/academy" },
  { label: "Profile", href: "/dashboard/profile" },
  { label: "Security", href: "/dashboard/security" },
  { label: "Verification", href: "/dashboard/verification" },
  { label: "Refer a Friend", href: "/dashboard/referral" },
];

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = new URL(req.url).searchParams.get("q")?.toLowerCase().trim() ?? "";
  if (!q) return NextResponse.json({ pages: [], traders: [], instruments: [] });

  const pages = navPages.filter((p) => p.label.toLowerCase().includes(q));

  const [traders, instruments] = await Promise.all([
    // CopyTrader table has its own firstName/lastName fields
    db.copyTrader.findMany({
      where: {
        OR: [
          { firstName: { contains: q } },
          { lastName: { contains: q } },
        ],
      },
      select: { id: true, firstName: true, lastName: true, profitRate30d: true },
      take: 5,
    }),
    db.instrument.findMany({
      where: {
        enabled: true,
        OR: [{ source: { contains: q } }, { target: { contains: q } }],
      },
      select: { id: true, source: true, target: true },
      take: 5,
    }),
  ]);

  return NextResponse.json({ pages, traders, instruments });
}
