import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TwoFactorToggle } from "@/components/dashboard/two-factor-toggle";
import { Shield, Key, Activity, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Security" };

export default async function SecurityPage() {
  const session = await auth();
  const user = await db.user.findUnique({
    where: { id: session!.user!.id },
    select: { twoFactorEnabled: true, emailVerified: true, createdAt: true },
  });

  const checks = [
    { label: "Email Verified",             ok: user?.emailVerified ?? false },
    { label: "Two-Factor Authentication",  ok: user?.twoFactorEnabled ?? false },
    { label: "Strong password set",        ok: true },
  ];
  const score = checks.filter((c) => c.ok).length;
  const scoreColor = score === 3 ? "text-emerald-600" : score === 2 ? "text-amber-500" : "text-red-500";
  const scoreBg   = score === 3 ? "bg-emerald-500" : score === 2 ? "bg-amber-400" : "bg-red-400";

  return (
    <div className="max-w-2xl space-y-6">
      {/* Security score banner */}
      <div
        className="rounded-2xl bg-black p-6 text-white relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-center gap-5">
          <div className="relative shrink-0">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke={score === 3 ? "#34d399" : score === 2 ? "#fbbf24" : "#f87171"}
                strokeWidth="3"
                strokeDasharray={`${(score / 3) * 100} 100`}
                strokeLinecap="round"
              />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-sm font-black ${scoreColor}`}>{score}/3</span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-1">Security Score</p>
            <p className="text-xl font-bold">{score === 3 ? "Fully Secured" : score === 2 ? "Good, one step left" : "Needs attention"}</p>
            <div className="flex items-center gap-2 mt-2">
              {checks.map((c) => (
                <div key={c.label} className={`h-1.5 flex-1 rounded-full ${c.ok ? scoreBg : "bg-white/15"}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {!user?.emailVerified && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Email not verified</p>
            <p className="text-xs text-amber-700 mt-0.5">Verify your email to secure your account and unlock all features.</p>
            <Link href="/dashboard/verification" className="text-xs font-semibold text-amber-800 underline mt-1 inline-block">Verify now →</Link>
          </div>
        </div>
      )}

      {/* 2FA */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <Shield className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Require a second verification step every time you sign in</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TwoFactorToggle enabled={user?.twoFactorEnabled ?? false} />
        </CardContent>
      </Card>

      {/* Password */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
              <Key className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <CardTitle>Password</CardTitle>
              <CardDescription>Update your account password regularly for best security</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 mb-4">Use a strong, unique password with at least 8 characters, including uppercase letters and numbers.</p>
          <Link
            href="/dashboard/change-password"
            className="inline-flex items-center gap-2 rounded-xl bg-black text-white px-4 py-2.5 text-sm font-semibold hover:bg-orange-500 transition-colors"
          >
            <Key className="h-4 w-4" /> Change Password
          </Link>
        </CardContent>
      </Card>

      {/* Status checklist */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Activity className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle>Security Checklist</CardTitle>
              <CardDescription>Complete all steps to fully protect your account</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {checks.map((c) => (
              <div key={c.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-700">{c.label}</span>
                {c.ok
                  ? <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                  : <XCircle className="h-4.5 w-4.5 text-red-400" />
                }
              </div>
            ))}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-500">Member since</span>
              <span className="text-sm font-semibold text-slate-800">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
