"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowLeft } from "lucide-react";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import type React from "react";

const BTN: React.CSSProperties = {
  background: "linear-gradient(135deg, #1e1e1e 0%, #2b1a0c 100%)",
  border: "1px solid rgba(240,112,32,0.28)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07), 0 4px 14px rgba(0,0,0,0.5)",
};

const INPUT = "h-11 w-full rounded-lg border bg-[#111111] pl-10 pr-4 text-sm text-white placeholder:text-slate-600 border-white/10 hover:border-white/20 focus:border-white/30 focus:outline-none transition-colors";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(data: ForgotPasswordInput) {
    setServerError("");
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const d = await res.json();
      setServerError(d.error ?? "Something went wrong.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-white/4 border border-white/10 flex items-center justify-center">
          <Mail className="h-8 w-8 text-slate-300" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Check your inbox</h2>
        <p className="text-sm text-slate-500 mb-2">
          If <span className="text-white font-medium">{getValues("email")}</span> is registered,
          you&apos;ll receive a password reset link shortly.
        </p>
        <p className="text-xs text-slate-700 mb-8">Check your spam folder if you don&apos;t see it within a few minutes.</p>
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-white transition-colors mb-8">
        <ArrowLeft className="h-4 w-4" /> Back to Sign In
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Reset your password</h1>
        <p className="mt-2 text-sm text-slate-500">
          Enter the email address linked to your Pipnova account and we&apos;ll send you a reset link.
        </p>
      </div>

      {serverError && (
        <div className="mb-5 rounded-lg bg-red-500/8 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none" />
            <input
              {...register("email")}
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              className={INPUT}
            />
          </div>
          {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
        </div>

        <Button type="submit" variant="brand" size="lg" loading={isSubmitting} className="w-full" style={BTN}>
          Send Reset Link
        </Button>
      </form>
    </div>
  );
}
