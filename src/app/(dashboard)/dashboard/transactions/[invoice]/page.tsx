import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusBadgeVariant } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, XCircle } from "lucide-react";
import { CryptoAddressQR } from "@/components/dashboard/crypto-address-qr";

export default async function TransactionDetailPage({ params }: { params: Promise<{ invoice: string }> }) {
  const session = await auth();
  const { invoice } = await params;

  const tx = await db.transaction.findFirst({
    where: { invoice, userId: session!.user!.id },
  });

  if (!tx) notFound();

  const statusIcon = tx.status === "confirmed"
    ? <CheckCircle2 className="h-12 w-12 text-emerald-500" />
    : tx.status === "failed"
    ? <XCircle className="h-12 w-12 text-red-500" />
    : <Clock className="h-12 w-12 text-amber-500" />;

  const statusMsg = {
    pending: "Your transaction is being reviewed. This usually takes 24–48 hours.",
    confirmed: "This transaction has been confirmed and processed successfully.",
    failed: "This transaction was not processed. Please contact support.",
  }[tx.status] ?? "";

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/dashboard/transactions" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft className="h-4 w-4" /> All Transactions
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status hero */}
          <div className="text-center py-6">
            <div className="flex justify-center mb-3">{statusIcon}</div>
            <Badge variant={statusBadgeVariant(tx.status)} className="text-sm px-4 py-1 mb-3">
              {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
            </Badge>
            <p className="text-2xl font-bold text-slate-900 mt-2">{formatCurrency(tx.amount)}</p>
            <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">{statusMsg}</p>
          </div>

          {/* Details grid */}
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {[
              { label: "Invoice", value: tx.invoice },
              { label: "Type", value: tx.type.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()) },
              { label: "Amount", value: formatCurrency(tx.amount) },
              { label: "Payment Method", value: tx.paymentMethodTitle ?? "—" },
              tx.walletAddress ? { label: "Wallet Address", value: tx.walletAddress } : null,
              tx.bankName ? { label: "Bank", value: tx.bankName } : null,
              tx.accountNumber ? { label: "Account Number", value: tx.accountNumber } : null,
              { label: "Submitted", value: formatDateTime(tx.createdAt) },
              tx.confirmedAt ? { label: "Processed", value: formatDateTime(tx.confirmedAt) } : null,
            ].filter(Boolean).map((row) => (
              <div key={row!.label} className="flex justify-between items-center px-4 py-3 text-sm">
                <span className="text-slate-500">{row!.label}</span>
                <span className="font-medium text-slate-900 text-right max-w-[60%] break-all">{row!.value}</span>
              </div>
            ))}
          </div>

          {tx.status === "pending" && tx.type === "deposit" && tx.walletAddress && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-800">Payment Address</p>
              <p className="text-xs text-slate-600">
                Send <strong>{tx.paymentMethodSymbol ? `${tx.paymentMethodCurrency} (${tx.paymentMethodSymbol})` : tx.paymentMethodTitle ?? "crypto"}</strong> to the address below to complete your deposit.
              </p>
              <CryptoAddressQR address={tx.walletAddress} symbol={tx.paymentMethodSymbol} />
            </div>
          )}

          {tx.status === "pending" && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700">
              <p className="font-medium mb-1">Need help?</p>
              <p className="text-xs">If your deposit is taking longer than expected, please contact our support team with your invoice number: <strong>{tx.invoice}</strong></p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
