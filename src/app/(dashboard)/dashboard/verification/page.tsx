import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmailVerification } from "@/components/dashboard/email-verification";
import { CheckCircle2, Clock, XCircle, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Verification" };

export default async function VerificationPage() {
  const session = await auth();
  const user = await db.user.findUnique({
    where: { id: session!.user!.id },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      emailVerified: true,
      kyc: {
        select: {
          status: true,
          rejectionReason: true,
        },
      },
    },
  });

  const kycStatus = (user as any)?.kyc?.status ?? "none";
  const rejectionReason = (user as any)?.kyc?.rejectionReason;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Email verification */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Email Verification</CardTitle>
              <CardDescription>Verify your email address to secure your account</CardDescription>
            </div>
            {user?.emailVerified && (
              <div className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">Verified</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {user?.emailVerified ? (
            <p className="text-sm text-slate-600">Your email <strong>{user.email}</strong> is verified.</p>
          ) : (
            <EmailVerification email={user?.email ?? ""} />
          )}
        </CardContent>
      </Card>

      {/* KYC */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Identity Verification (KYC)</CardTitle>
              <CardDescription>
                {kycStatus === "approved"
                  ? "Your identity has been verified"
                  : kycStatus === "pending"
                  ? "Your documents are under review"
                  : kycStatus === "rejected"
                  ? "Your verification was rejected"
                  : "Complete verification to unlock full account features"}
              </CardDescription>
            </div>
            {kycStatus === "approved" && (
              <div className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">Approved</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {kycStatus === "approved" && (
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-4">
              <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
              <p className="text-sm text-emerald-800">Your identity has been successfully verified. Your account is fully unlocked.</p>
            </div>
          )}

          {kycStatus === "pending" && (
            <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4">
              <Clock className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">Under Review</p>
                <p className="text-xs text-amber-700 mt-0.5">Your documents are being reviewed. This usually takes 1–3 business days.</p>
              </div>
            </div>
          )}

          {kycStatus === "rejected" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4">
                <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800">Verification Rejected</p>
                  {rejectionReason && <p className="text-xs text-red-700 mt-0.5">{rejectionReason}</p>}
                  <p className="text-xs text-red-600 mt-1">Please correct the issue and resubmit.</p>
                </div>
              </div>
              <Link
                href="/dashboard/verification/kyc"
                className="inline-flex items-center gap-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2.5 transition-colors"
              >
                Resubmit Verification <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          {kycStatus === "none" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Identity verification is required to make deposits, withdrawals, and access all trading features. The process takes about 5 minutes.
              </p>
              <ul className="text-sm text-slate-500 space-y-1.5">
                <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-orange-400 shrink-0" />Personal information</li>
                <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-orange-400 shrink-0" />Residential address</li>
                <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-orange-400 shrink-0" />Government-issued ID (passport, driving licence, or national ID)</li>
              </ul>
              <Link
                href="/dashboard/verification/kyc"
                className="inline-flex items-center gap-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2.5 transition-colors"
              >
                Start Verification <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
