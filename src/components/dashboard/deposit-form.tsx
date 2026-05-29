"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { depositSchema, type DepositInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { formatCurrency } from "@/lib/utils";
import { CryptoAddressQR } from "@/components/dashboard/crypto-address-qr";

interface PaymentMethod {
  id: string;
  title: string;
  type: string;
  symbol: string | null;
  currency: string;
  exchangeRate: number;
  walletAddress: string | null;
  accountNumber: string | null;
  bankName: string | null;
  accountName: string | null;
}

interface DepositFormProps {
  paymentMethods: PaymentMethod[];
  min: number;
  max: number;
}

export function DepositForm({ paymentMethods, min, max }: DepositFormProps) {
  const router = useRouter();
  const [selectedPm, setSelectedPm] = useState(paymentMethods[0]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DepositInput>({
    resolver: zodResolver(depositSchema),
    defaultValues: { paymentMethodId: paymentMethods[0]?.id },
  });

  const amount = watch("amount");
  const equivalent = selectedPm ? (amount || 0) * selectedPm.exchangeRate : 0;

  async function onSubmit(data: DepositInput) {
    const res = await fetch("/api/transactions/deposit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      toast.error(result.error ?? "Deposit request failed");
      return;
    }
    toast.success("Deposit request submitted successfully");
    router.push(`/dashboard/transactions/${result.invoice}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Input
            label="Amount (USD)"
            type="number"
            step="0.01"
            min={min}
            max={max}
            placeholder={`Min ${formatCurrency(min)}`}
            {...register("amount", { valueAsNumber: true })}
            error={errors.amount?.message}
          />
          {amount > 0 && selectedPm && (
            <p className="mt-1.5 text-xs text-slate-500">
              ≈ {equivalent.toFixed(4)} {selectedPm.symbol ?? selectedPm.currency}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Method</label>
          <select
            {...register("paymentMethodId")}
            onChange={(e) => {
              const pm = paymentMethods.find((p) => p.id === e.target.value);
              if (pm) setSelectedPm(pm);
            }}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 hover:border-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black transition-colors"
          >
            {paymentMethods.map((pm) => (
              <option key={pm.id} value={pm.id}>{pm.title} ({pm.currency})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Payment instructions */}
      {selectedPm && (
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2">
          <p className="text-sm font-semibold text-slate-800">Payment Instructions</p>
          {selectedPm.type === "crypto" ? (
            <>
              <p className="text-xs text-slate-700">Send exactly <strong>{equivalent.toFixed(4)} {selectedPm.symbol}</strong> to the address below:</p>
              {selectedPm.walletAddress
                ? <CryptoAddressQR address={selectedPm.walletAddress} symbol={selectedPm.symbol} />
                : <p className="text-xs text-slate-500">Contact support for the wallet address.</p>
              }
              <p className="text-xs text-slate-500">After sending, submit this form and your deposit will be confirmed within 24 hours.</p>
            </>
          ) : (
            <div className="space-y-1 text-xs text-slate-700">
              {selectedPm.bankName && <p>Bank: <strong>{selectedPm.bankName}</strong></p>}
              {selectedPm.accountName && <p>Account Name: <strong>{selectedPm.accountName}</strong></p>}
              {selectedPm.accountNumber && <p>Account No: <strong>{selectedPm.accountNumber}</strong></p>}
              <p className="text-slate-500">Submit the form after making your transfer. Use your username as reference.</p>
            </div>
          )}
        </div>
      )}

      <Button type="submit" size="lg" loading={isSubmitting} className="w-full sm:w-auto">
        Submit Deposit Request
      </Button>
    </form>
  );
}
