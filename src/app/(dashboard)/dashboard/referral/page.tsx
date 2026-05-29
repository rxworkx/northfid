import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CopyReferralLink } from "@/components/dashboard/copy-referral-link";
import { Users, DollarSign, Percent, Gift, ArrowRight } from "lucide-react";

export const metadata = { title: "Refer a Friend" };

export default async function ReferralPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [user, referrals, totalEarned] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { referralCode: true, username: true } }),
    db.user.findMany({
      where: { referrerId: userId },
      select: { firstName: true, lastName: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    db.transaction.aggregate({ where: { userId, type: "referral", status: "confirmed" }, _sum: { amount: true } }),
  ]);

  const referralLink = `${process.env.NEXT_PUBLIC_APP_URL}/register?ref=${user?.referralCode ?? user?.username}`;

  const howItWorks = [
    { step: "01", title: "Share your link", desc: "Copy your unique referral link and share it with friends, on social media, or in trading communities." },
    { step: "02", title: "They register", desc: "Your friend signs up using your link. They get access to all Pipnova features immediately." },
    { step: "03", title: "They deposit", desc: "When they make their first confirmed deposit, the commission is automatically credited to your balance." },
  ];

  return (
    <div className="max-w-3xl space-y-8">
      {/* Hero */}
      <div
        className="relative rounded-2xl overflow-hidden bg-black text-white p-7"
      >
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400 mb-4">
            <Gift className="h-3.5 w-3.5" /> Referral Programme
          </div>
          <h1 className="text-2xl font-bold mb-2">Earn 5% on every friend's deposit</h1>
          <p className="text-sm text-white/50 leading-relaxed max-w-md">
            Invite friends to Pipnova and earn a 5% commission on every confirmed deposit they make. No limits, paid instantly.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Referrals", value: referrals.length.toString(), icon: <Users className="h-5 w-5 text-orange-500" />, bg: "bg-orange-50" },
          { label: "Total Earned",   value: formatCurrency(totalEarned._sum.amount ?? 0), icon: <DollarSign className="h-5 w-5 text-emerald-500" />, bg: "bg-emerald-50" },
          { label: "Commission Rate",value: "5%", icon: <Percent className="h-5 w-5 text-purple-500" />, bg: "bg-purple-50" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5 text-center">
            <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center mx-auto mb-3`}>{s.icon}</div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Referral link */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
          <CardDescription>Share this link and earn 5% on every confirmed deposit your referrals make</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CopyReferralLink link={referralLink} code={user?.referralCode ?? ""} />
        </CardContent>
      </Card>

      {/* How it works */}
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-4">How it works</h2>
        <div className="space-y-3">
          {howItWorks.map((h) => (
            <div key={h.step} className="flex gap-4 rounded-xl bg-white border border-slate-100 shadow-sm p-5">
              <div className="shrink-0 h-9 w-9 rounded-xl bg-orange-50 flex items-center justify-center text-xs font-black text-orange-500">
                {h.step}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 mb-0.5">{h.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{h.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Referral list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">Your Referrals</h2>
          <span className="text-xs text-slate-400">{referrals.length} total</span>
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          {referrals.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No referrals yet</p>
              <p className="text-xs text-slate-300 mt-1">Share your link above to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {referrals.map((r, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                      {r.firstName[0]}{r.lastName[0]}
                    </div>
                    <span className="text-sm font-semibold text-slate-800">{r.firstName} {r.lastName}</span>
                  </div>
                  <span className="text-xs text-slate-400">{formatDate(r.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
