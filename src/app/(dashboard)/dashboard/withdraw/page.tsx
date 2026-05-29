import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { WithdrawForm } from "@/components/dashboard/withdraw-form";

export const metadata = { title: "Withdraw" };

export default async function WithdrawPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [user, paymentMethods, settings] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { wallet: { select: { balance: true } } } }),
    db.paymentMethod.findMany({ where: { enabled: true, forWithdrawal: true }, orderBy: { orderIndex: "asc" } }),
    db.settings.findUnique({ where: { id: "singleton" } }),
  ]);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="rounded-xl bg-black p-5 text-white">
        <p className="text-sm text-slate-400 mb-1">Available Balance</p>
        <p className="text-3xl font-bold">{formatCurrency((user as any)?.wallet?.balance ?? 0)}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Withdraw Funds</CardTitle>
          <CardDescription>
            Min: {formatCurrency(settings?.minimumWithdrawal ?? 50)} · Max: {formatCurrency(settings?.maximumWithdrawal ?? 50000)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paymentMethods.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No withdrawal methods available. Please contact support.</p>
          ) : (
            <WithdrawForm
              paymentMethods={paymentMethods}
              balance={(user as any)?.wallet?.balance ?? 0}
              min={settings?.minimumWithdrawal ?? 50}
              max={settings?.maximumWithdrawal ?? 50000}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
