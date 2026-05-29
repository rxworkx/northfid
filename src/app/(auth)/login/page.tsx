"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import type React from "react";

const BTN: React.CSSProperties = {
  background: "linear-gradient(135deg, #1e1e1e 0%, #2b1a0c 100%)",
  border: "1px solid rgba(240,112,32,0.28)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07), 0 4px 14px rgba(0,0,0,0.5)",
};

const INPUT = "h-11 w-full rounded-lg border bg-[#111111] pl-10 pr-4 text-sm text-white placeholder:text-slate-600 border-white/10 hover:border-white/20 focus:border-white/30 focus:outline-none transition-colors";
const INPUT_PR = "h-11 w-full rounded-lg border bg-[#111111] pl-10 pr-11 text-sm text-white placeholder:text-slate-600 border-white/10 hover:border-white/20 focus:border-white/30 focus:outline-none transition-colors";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const registered = searchParams.get("registered");
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    setServerError("");
    const res = await signIn("credentials", {
      identifier: data.identifier,
      password: data.password,
      redirect: false,
    });

    if (res?.error) {
      setServerError("Invalid credentials. Please check your email and password.");
      return;
    }

    // Record the login session (device detection runs server-side)
    fetch("/api/auth/record-login", { method: "POST" }).catch(() => {});

    // Check if the user is admin and redirect accordingly
    const session = await getSession();
    const role = (session?.user as any)?.role;
    if (role === "admin") {
      router.push("/admin");
    } else {
      router.push(callbackUrl);
    }
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-500">Sign in to your Pipnova account</p>
      </div>

      {registered && (
        <div className="mb-5 rounded-lg bg-white/4 border border-white/10 px-4 py-3 text-sm text-slate-300">
          Account created. You can now sign in.
        </div>
      )}

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
              {...register("identifier")}
              type="text"
              placeholder="Email, phone or username"
              autoComplete="username"
              className={INPUT}
            />
          </div>
          {errors.identifier && <p className="mt-1.5 text-xs text-red-400">{errors.identifier.message}</p>}
        </div>

        <div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none" />
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              autoComplete="current-password"
              className={INPUT_PR}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>}
        </div>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs text-slate-500 hover:text-white transition-colors">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" variant="brand" size="lg" loading={isSubmitting} className="w-full" style={BTN}>
          Sign In
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-slate-600">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-slate-300 hover:text-white font-medium transition-colors">
          Create one free
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-sm h-80 rounded-xl bg-white/3 animate-pulse" />}>
      <LoginForm />
    </Suspense>
  );
}
