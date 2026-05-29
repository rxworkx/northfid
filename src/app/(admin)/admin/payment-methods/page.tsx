import { AdminTopbar } from "@/components/admin/topbar";
import { db } from "@/lib/db";
import { AdminPaymentMethodsClient } from "./client";

export default async function AdminPaymentMethodsPage() {
  const methods = await db.paymentMethod.findMany({ orderBy: { orderIndex: "asc" } });
  return (
    <>
      <AdminTopbar title="Payment Methods" subtitle={`${methods.length} methods configured`} />
      <AdminPaymentMethodsClient methods={methods} />
    </>
  );
}
