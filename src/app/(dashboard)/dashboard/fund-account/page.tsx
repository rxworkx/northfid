import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DepositForm } from "@/components/dashboard/deposit-form";
import { ShieldCheck, Zap, Clock } from "lucide-react";

export const metadata = { title: "Fund Account" };

export default async function FundAccountPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [user, allPaymentMethods, settings] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { allowFundFromBalance: true, wallet: { select: { balance: true } } } }),
    db.paymentMethod.findMany({ where: { enabled: true, forDeposit: true }, orderBy: { orderIndex: "asc" } }),
    db.settings.findUnique({ where: { id: "singleton" } }),
  ]);

  const balance = (user as any)?.wallet?.balance ?? 0;
  const min = settings?.minimumDeposit ?? 100;
  const max = settings?.maximumDeposit ?? 100000;

  // Filter out Fund from Balance if disabled site-wide or for this user
  const fundFromBalanceAllowed = (settings?.allowFundFromBalance ?? true) && (user?.allowFundFromBalance ?? true);
  const paymentMethods = fundFromBalanceAllowed
    ? allPaymentMethods
    : allPaymentMethods.filter((pm) => pm.type !== "balance");

  return (
    <div className="max-w-3xl space-y-6">
      {/* Balance hero */}
      <div
        className="relative rounded-2xl overflow-hidden bg-black text-white p-7"
      >
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-2">Current Balance</p>
          <p className="text-4xl font-bold tracking-tight">{formatCurrency(balance)}</p>
        </div>
      </div>

      {/* Trust badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: <ShieldCheck className="h-4 w-4 text-orange-500" />, text: "Secure & Encrypted" },
          { icon: <Zap className="h-4 w-4 text-orange-500" />, text: "Instant Processing" },
          { icon: <Clock className="h-4 w-4 text-orange-500" />, text: "24/7 Support" },
        ].map((b) => (
          <div key={b.text} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2.5 shadow-sm">
            {b.icon}
            <span className="text-xs font-medium text-slate-600">{b.text}</span>
          </div>
        ))}
      </div>

      {/* Deposit form */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Deposit Funds</CardTitle>
          <CardDescription>
            Min: <strong>{formatCurrency(min)}</strong> &nbsp;·&nbsp; Max: <strong>{formatCurrency(max)}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paymentMethods.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No deposit methods available. Please contact support.</p>
          ) : (
            <DepositForm paymentMethods={paymentMethods} min={min} max={max} walletBalance={balance} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
