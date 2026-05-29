import { auth } from "@/auth";
import { db } from "@/lib/db";
import { resolveStorageUrl } from "@/lib/storage";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { AvatarUpload } from "@/components/dashboard/avatar-upload";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { ShieldCheck, KeyRound, BadgeCheck } from "lucide-react";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await auth();
  const user = await db.user.findUnique({
    where: { id: session!.user!.id },
    select: {
      id: true, username: true, firstName: true, lastName: true,
      email: true, phone: true, country: true, gender: true,
      emailVerified: true, image: true,
      kyc: { select: { status: true } },
    },
  });
  if (!user) return null;

  const image = resolveStorageUrl(user.image, "users");
  const kycStatus = user.kyc?.status ?? "none";

  const quickLinks = [
    { icon: <KeyRound className="h-4 w-4 text-slate-500" />, label: "Change Password", href: "/dashboard/change-password", desc: "Update your login credentials" },
    { icon: <ShieldCheck className="h-4 w-4 text-slate-500" />, label: "Security Settings", href: "/dashboard/security", desc: "2FA and account security" },
    { icon: <BadgeCheck className="h-4 w-4 text-slate-500" />, label: "Identity Verification", href: "/dashboard/verification", desc: kycStatus === "approved" ? "Verified ✓" : kycStatus === "pending" ? "Under review" : "Not verified" },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      {/* Avatar */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>Upload a photo to personalise your account</CardDescription>
        </CardHeader>
        <CardContent>
          <AvatarUpload userId={user.id} currentImage={image} name={`${user.firstName} ${user.lastName}`} />
        </CardContent>
      </Card>

      {/* Personal info */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your profile details. Changes take effect immediately.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm user={user} />
        </CardContent>
      </Card>

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Account Settings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex items-center gap-3 rounded-xl bg-white border border-slate-100 shadow-sm p-4 hover:border-slate-200 hover:shadow-md transition-all group"
            >
              <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-orange-50 transition-colors">
                {l.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800">{l.label}</p>
                <p className="text-xs text-slate-400 truncate">{l.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
