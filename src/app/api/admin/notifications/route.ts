import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, unauthorized } from "../_auth";
import { sendNotificationEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 30;

  // Group by title+body+delivery+type so bulk sends appear as one row with a count
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

  // For each group, fetch the representative record to get the user info
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
        createdAt: g._max.createdAt,
        recipientCount: g._count.id,
        user: rep!.user,
      };
    })
  );

  return NextResponse.json({ rows, total: totalGroups, page, pages: Math.ceil(totalGroups / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const { userId, userIds, customEmail, title, body, href, type, sendEmail, sendNotification } = await req.json();

  if (!title || !body) return NextResponse.json({ error: "title and body required" }, { status: 400 });

  const delivery = sendEmail && sendNotification ? "both" : sendEmail ? "email" : "notification";
  const result: Record<string, number> = {};

  // Custom email — log using admin's userId so it appears in the log
  if (customEmail) {
    if (!sendEmail) return NextResponse.json({ error: "Custom email requires email delivery" }, { status: 400 });
    try {
      await sendNotificationEmail(customEmail, "", title, body, href || "/dashboard");
    } catch (e: any) {
      console.error("[admin/notifications] custom email failed:", e);
      return NextResponse.json({ error: e.message ?? "Email send failed" }, { status: 500 });
    }
    // Log using admin's userId so it appears in the notifications log
    await db.notification.create({
      data: {
        userId: session.user!.id as string,
        type: type || "announcement",
        title: `[→ ${customEmail}] ${title}`,
        body,
        href: href || "/dashboard",
        delivery: "email",
        read: true,
      },
    });
    result.emailsSent = 1;
    return NextResponse.json(result);
  }

  const targets: string[] = userId ? [userId] : (userIds ?? []);
  if (targets.length === 0) {
    const users = await db.user.findMany({ select: { id: true } });
    targets.push(...users.map((u) => u.id));
  }

  // Write one record per recipient — email-only pre-marked read so it doesn't show in user's bell
  await db.notification.createMany({
    data: targets.map((uid) => ({
      userId: uid,
      type: type || "announcement",
      title,
      body,
      href: href || "/dashboard",
      delivery,
      read: delivery === "email",
    })),
  });

  result.sent = targets.length;
  if (sendNotification) result.notificationsSent = targets.length;

  if (sendEmail) {
    const recipients = await db.user.findMany({
      where: { id: { in: targets } },
      select: { firstName: true, email: true },
    });
    const emailResults = await Promise.allSettled(
      recipients.map((u) => sendNotificationEmail(u.email, u.firstName, title, body, href || "/dashboard"))
    );
    const failed = emailResults.filter((r) => r.status === "rejected");
    failed.forEach((r, i) =>
      console.error(`[admin/notifications] email ${i} failed:`, (r as PromiseRejectedResult).reason)
    );
    result.emailsSent = emailResults.length - failed.length;
    if (failed.length > 0) result.emailsFailed = failed.length;
  }

  return NextResponse.json(result);
}
