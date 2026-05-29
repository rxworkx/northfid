import { AdminTopbar } from "@/components/admin/topbar";
import { db } from "@/lib/db";
import { AdminSettingsClient } from "./client";

export default async function AdminSettingsPage() {
  let settings = await db.settings.findUnique({ where: { id: "singleton" } });
  if (!settings) {
    settings = await db.settings.create({ data: { id: "singleton" } });
  }
  return (
    <>
      <AdminTopbar title="Settings" subtitle="Global platform configuration" />
      <AdminSettingsClient settings={settings} />
    </>
  );
}
