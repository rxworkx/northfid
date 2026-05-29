"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, User, Mail, Lock, Globe, AtSign } from "lucide-react";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { COUNTRIES } from "@/lib/countries";
import type React from "react";

const BTN: React.CSSProperties = {
  background: "linear-gradient(135deg, #1e1e1e 0%, #2b1a0c 100%)",
  border: "1px solid rgba(240,112,32,0.28)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07), 0 4px 14px rgba(0,0,0,0.5)",
};

const INPUT = "h-11 w-full rounded-lg border bg-[#111111] pl-10 pr-4 text-sm text-white placeholder:text-slate-600 border-white/10 hover:border-white/20 focus:border-white/30 focus:outline-none transition-colors";
const INPUT_PR = "h-11 w-full rounded-lg border bg-[#111111] pl-10 pr-11 text-sm text-white placeholder:text-slate-600 border-white/10 hover:border-white/20 focus:border-white/30 focus:outline-none transition-colors";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referrerCode = searchParams.get("ref") ?? "";
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { referrerCode },
  });

  const username = watch("username");

  async function checkUsername(value: string) {
    if (!value || value.length < 3) return;
    setUsernameStatus("checking");
    const res = await fetch(`/api/user/check-username?username=${encodeURIComponent(value)}`);
    const data = await res.json();
    setUsernameStatus(data.available ? "available" : "taken");
  }

  async function onSubmit(data: RegisterInput) {
    setServerError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!res.ok) {
      setServerError(result.error ?? "Registration failed. Please try again.");
      return;
    }
    router.push("/login?registered=1");
  }

  return (
    <div className="w-full max-w-sm lg:mt-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Create your account</h1>
        <p className="mt-2 text-sm text-slate-500">Join 50,000+ traders on Pipnova, it&apos;s free</p>
      </div>

      {serverError && (
        <div className="mb-5 rounded-lg bg-red-500/8 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none" />
              <input {...register("firstName")} placeholder="First name" className={INPUT} />
            </div>
            {errors.firstName && <p className="mt-1 text-xs text-red-400">{errors.firstName.message}</p>}
          </div>
          <div>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none" />
              <input {...register("lastName")} placeholder="Last name" className={INPUT} />
            </div>
            {errors.lastName && <p className="mt-1 text-xs text-red-400">{errors.lastName.message}</p>}
          </div>
        </div>

        <div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none" />
            <input {...register("email")} type="email" placeholder="Email address" autoComplete="email" className={INPUT} />
          </div>
          {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
        </div>

        <div>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none z-10" />
            <select
              {...register("country")}
              className="h-11 w-full rounded-lg border bg-[#111111] pl-10 pr-4 text-sm text-white border-white/10 hover:border-white/20 focus:border-white/30 focus:outline-none transition-colors appearance-none"
            >
              <option value="" className="bg-[#111111]">Select your country</option>
              {COUNTRIES.map((c) => <option key={c.code} value={c.name} className="bg-[#111111]">{c.name}</option>)}
            </select>
          </div>
          {errors.country && <p className="mt-1 text-xs text-red-400">{errors.country.message}</p>}
        </div>

        <div>
          <div className="relative">
            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none" />
            <input
              {...register("username")}
              placeholder="Username"
              autoComplete="username"
              className={INPUT}
              onBlur={(e) => checkUsername(e.target.value)}
            />
            {usernameStatus === "available" && username && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-400">available</span>
            )}
            {usernameStatus === "taken" && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-red-400">taken</span>
            )}
            {usernameStatus === "checking" && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">checking</span>
            )}
          </div>
          {errors.username && <p className="mt-1 text-xs text-red-400">{errors.username.message}</p>}
        </div>

        <div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none" />
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="Password (min 8 chars)"
              autoComplete="new-password"
              className={INPUT_PR}
            />
            <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
        </div>

        <div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none" />
            <input
              {...register("confirmPassword")}
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm password"
              autoComplete="new-password"
              className={INPUT_PR}
            />
            <button type="button" onClick={() => setShowConfirm((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors">
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p>}
        </div>

        {referrerCode && (
          <div>
            <input {...register("referrerCode")} type="hidden" />
            <p className="text-xs text-slate-500">Referred by: {referrerCode}</p>
          </div>
        )}

        <Button type="submit" variant="brand" size="lg" loading={isSubmitting} className="w-full mt-1" style={BTN}>
          Create Account
        </Button>

        <p className="text-center text-xs text-slate-600 leading-relaxed pt-1">
          By creating an account you agree to our{" "}
          <a href="#" className="text-slate-400 hover:text-white transition-colors">Terms of Service</a>{" "}
          and{" "}
          <a href="#" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</a>
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="text-slate-300 hover:text-white font-medium transition-colors">Sign in</Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-sm h-150 rounded-xl bg-white/3 animate-pulse" />}>
      <RegisterForm />
    </Suspense>
  );
}
