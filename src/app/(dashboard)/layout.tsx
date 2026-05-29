import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { MobilePageTitle } from "@/components/dashboard/mobile-page-title";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, firstName: true, lastName: true, username: true,
      email: true, emailVerified: true, isCopyTrader: true, image: true,
      wallet: { select: { balance: true } },
      kyc: { select: { status: true } },
    },
  });

  if (!user) redirect("/login");

  const flatUser = {
    ...user,
    walletBalance: user.wallet?.balance ?? 0,
    kycStatus: user.kyc?.status ?? "none",
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <DashboardSidebar user={flatUser} />

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0">
        <DashboardTopbar user={flatUser} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <MobilePageTitle />
          {children}
        </main>
      </div>
    </div>
  );
}
