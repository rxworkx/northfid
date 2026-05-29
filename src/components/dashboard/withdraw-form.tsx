"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { withdrawSchema, type WithdrawInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { formatCurrency } from "@/lib/utils";

interface PaymentMethod {
  id: string;
  title: string;
  type: string;
  symbol: string | null;
  currency: string;
}

interface WithdrawFormProps {
  paymentMethods: PaymentMethod[];
  balance: number;
  min: number;
  max: number;
}

export function WithdrawForm({ paymentMethods, balance, min, max }: WithdrawFormProps) {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [selectedType, setSelectedType] = useState(paymentMethods[0]?.type ?? "crypto");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WithdrawInput>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: { paymentMethodId: paymentMethods[0]?.id },
  });

  async function onSubmit(data: WithdrawInput) {
    if (data.amount > balance) {
      toast.error("Insufficient balance");
      return;
    }
    const res = await fetch("/api/transactions/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      toast.error(result.error ?? "Withdrawal request failed");
      return;
    }
    toast.success("Withdrawal request submitted");
    router.push(`/dashboard/transactions/${result.invoice}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <Input
          label="Amount (USD)"
          type="number"
          step="0.01"
          min={min}
          max={Math.min(max, balance)}
          placeholder={`Min ${formatCurrency(min)}`}
          {...register("amount", { valueAsNumber: true })}
          error={errors.amount?.message}
          hint={`Available: ${formatCurrency(balance)}`}
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Method</label>
          <select
            {...register("paymentMethodId")}
            onChange={(e) => {
              const pm = paymentMethods.find((p) => p.id === e.target.value);
              if (pm) setSelectedType(pm.type);
            }}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 hover:border-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black transition-colors"
          >
            {paymentMethods.map((pm) => (
              <option key={pm.id} value={pm.id}>{pm.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Crypto fields */}
      {selectedType === "crypto" && (
        <Input
          label="Wallet Address"
          placeholder="Your crypto wallet address"
          {...register("walletAddress")}
          error={errors.walletAddress?.message}
        />
      )}

      {/* Bank transfer fields */}
      {selectedType === "bank_transfer" && (
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Account Number" {...register("accountNumber")} error={errors.accountNumber?.message} />
          <Input label="Routing Number" {...register("routingNumber")} error={errors.routingNumber?.message} />
          <Input label="Bank Name" {...register("bankName")} error={errors.bankName?.message} />
          <Input label="Account Holder Name" {...register("accountName")} error={errors.accountName?.message} />
        </div>
      )}

      {/* Password confirmation */}
      <div className="pt-2 border-t border-slate-100">
        <p className="text-xs text-slate-500 mb-3">Confirm your account password to proceed with the withdrawal</p>
        <div className="relative max-w-xs">
          <input
            {...register("password")}
            type={showPass ? "text" : "password"}
            placeholder="Account password"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 pr-10 text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black transition-colors"
          />
          <button type="button" onClick={() => setShowPass((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
      </div>

      <Button type="submit" loading={isSubmitting} size="lg">
        Submit Withdrawal Request
      </Button>
    </form>
  );
}
