import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KycVerification } from "@/components/dashboard/kyc-verification";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Identity Verification" };

export default async function KycFormPage() {
  const session = await auth();
  const user = await db.user.findUnique({
    where: { id: session!.user!.id },
    select: {
      firstName: true,
      lastName: true,
      kyc: { select: { status: true, rejectionReason: true } },
    },
  });

  const kycStatus = (user as any)?.kyc?.status ?? "none";

  // Already verified or under review — send back
  if (kycStatus === "approved" || kycStatus === "pending") {
    redirect("/dashboard/verification");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/dashboard/verification"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Verification
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Identity Verification</CardTitle>
          <CardDescription>Complete all steps to verify your identity. This usually takes about 5 minutes.</CardDescription>
        </CardHeader>
        <CardContent>
          <KycVerification
            kycStatus={kycStatus}
            kycRecord={{ rejectionReason: (user as any)?.kyc?.rejectionReason }}
            userFirstName={user?.firstName}
            userLastName={user?.lastName}
          />
        </CardContent>
      </Card>
    </div>
  );
}
