import { AdminTopbar } from "@/components/admin/topbar";
import { db } from "@/lib/db";
import { AdminNotificationsClient } from "./client";

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminNotificationsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = parseInt(sp.page ?? "1");
  const limit = 30;

  const [groups, totalGroups] = await Promise.all([
    db.notification.groupBy({
      by: ["title", "body", "type", "href", "delivery"],
      _count: { id: true },
      _max: { createdAt: true },
      orderBy: { _max: { createdAt: "desc" } },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.notification
      .groupBy({ by: ["title", "body", "type", "href", "delivery"] })
      .then((g) => g.length),
  ]);

  const rows = await Promise.all(
    groups.map(async (g) => {
      const rep = await db.notification.findFirst({
        where: { title: g.title, body: g.body, delivery: g.delivery },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });
      return {
        id: rep!.id,
        type: g.type,
        title: g.title,
        body: g.body,
        href: g.href,
        delivery: g.delivery,
        createdAt: (g._max.createdAt ?? new Date()).toISOString(),
        recipientCount: g._count.id,
        user: rep!.user,
      };
    })
  );

  const users = await db.user.findMany({
    orderBy: { firstName: "asc" },
    select: { id: true, firstName: true, lastName: true, email: true },
  });

  return (
    <>
      <AdminTopbar title="Notifications" subtitle={`${totalGroups} notifications sent`} />
      <AdminNotificationsClient
        rows={rows}
        total={totalGroups}
        page={page}
        pages={Math.ceil(totalGroups / limit)}
        users={users}
      />
    </>
  );
}
