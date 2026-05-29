import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { createHash } from "crypto";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });
  const userId = session.user.id;

  const ua = req.headers.get("user-agent") ?? "";
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  // Stable hash of the user-agent to identify the device
  const deviceHash = createHash("sha256").update(ua).digest("hex").slice(0, 16);

  // Check if this device has logged in before
  const existingSession = await (db as any).loginSession.findFirst({
    where: { userId, deviceHash },
  });

  // Record this session (keep at most 20 per user)
  await (db as any).loginSession.create({
    data: { userId, ipAddress: ip, userAgent: ua.slice(0, 512), deviceHash },
  });

  const allSessions = await (db as any).loginSession.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  if (allSessions.length > 20) {
    const oldest = allSessions.slice(0, allSessions.length - 20);
    await (db as any).loginSession.deleteMany({
      where: { id: { in: oldest.map((s: any) => s.id) } },
    });
  }

  // New device — create a security notification
  if (!existingSession) {
    const deviceLabel = parseDevice(ua);
    await (db as any).notification.create({
      data: {
        userId,
        type: "new_login",
        title: "New sign-in detected",
        body: `Your account was accessed from a new device: ${deviceLabel}. If this wasn't you, change your password immediately.`,
        href: "/dashboard/security",
      },
    });
  }

  return NextResponse.json({ ok: true, isNewDevice: !existingSession });
}

function parseDevice(ua: string): string {
  if (!ua) return "Unknown device";
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Android/i.test(ua)) {
    if (/Mobile/i.test(ua)) return "Android phone";
    return "Android tablet";
  }
  if (/Macintosh/i.test(ua)) return "Mac";
  if (/Windows NT/i.test(ua)) return "Windows PC";
  if (/Linux/i.test(ua)) return "Linux";
  return "Unknown device";
}
