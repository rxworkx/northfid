import { AdminTopbar } from "@/components/admin/topbar";
import { db } from "@/lib/db";
import { AdminInstrumentsClient } from "./client";

interface PageProps {
  searchParams: Promise<{ search?: string; enabled?: string; page?: string }>;
}

export default async function AdminInstrumentsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const search = sp.search ?? "";
  const enabled = sp.enabled ?? "";
  const page = parseInt(sp.page ?? "1");
  const limit = 30;

  const where: any = {};
  if (enabled === "true") where.enabled = true;
  if (enabled === "false") where.enabled = false;
  if (search) {
    where.OR = [
      { source: { contains: search } },
      { target: { contains: search } },
    ];
  }

  const [instruments, total] = await Promise.all([
    db.instrument.findMany({
      where, orderBy: [{ source: "asc" }, { target: "asc" }],
      skip: (page - 1) * limit, take: limit,
    }),
    db.instrument.count({ where }),
  ]);

  return (
    <>
      <AdminTopbar title="Instruments" subtitle={`${total} total instruments`} />
      <AdminInstrumentsClient instruments={instruments} total={total} page={page} pages={Math.ceil(total / limit)} search={search} enabled={enabled} />
    </>
  );
}
