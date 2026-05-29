import { requireAdmin } from "@/lib/admin";
import { AdminSidebar } from "@/components/admin/sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="flex min-h-screen" style={{ background: "#f0f4f8" }}>
      <AdminSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        {children}
      </div>
    </div>
  );
}
