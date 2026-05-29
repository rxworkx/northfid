"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock } from "lucide-react";
import Link from "next/link";

const INPUT = "h-11 w-full rounded-lg border bg-[#111111] pl-10 pr-11 text-sm text-white placeholder:text-slate-600 border-white/10 hover:border-white/20 focus:border-white/30 focus:outline-none transition-colors";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-red-400 text-sm mb-4">Invalid or missing reset link.</p>
        <Link href="/login" className="text-orange-400 hover:text-orange-300 text-sm">Back to login</Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Something went wrong"); setLoading(false); return; }
    setDone(true);
    setTimeout(() => router.push("/login"), 2500);
  }

  if (done) {
    return (
      <div className="text-center space-y-3">
        <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
          <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <p className="text-white font-semibold">Password set successfully</p>
        <p className="text-slate-400 text-sm">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">{error}</p>}
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input type={showPw ? "text" : "password"} placeholder="New password" value={password}
          onChange={e => setPassword(e.target.value)} required className={INPUT} />
        <button type="button" onClick={() => setShowPw(p => !p)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input type={showPw ? "text" : "password"} placeholder="Confirm password" value={confirm}
          onChange={e => setConfirm(e.target.value)} required className={INPUT} />
      </div>
      <button type="submit" disabled={loading}
        className="w-full h-11 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-colors"
        style={{ background: "linear-gradient(135deg, #1e1e1e 0%, #2b1a0c 100%)", border: "1px solid rgba(240,112,32,0.28)" }}>
        {loading ? "Setting password..." : "Set new password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Set your password</h1>
          <p className="text-slate-400 text-sm">Your account was migrated. Please set a new password to continue.</p>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-8">
          <Suspense>
            <ResetForm />
          </Suspense>
        </div>
        <p className="text-center text-slate-600 text-xs mt-6">
          Already have a password? <Link href="/login" className="text-orange-400 hover:text-orange-300">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
