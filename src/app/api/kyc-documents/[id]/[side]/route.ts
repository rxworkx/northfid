import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { detectImageType, readKycFile } from "@/lib/storage";

// Serves an identity document to its owner or an admin. The file is looked up
// from the database record, so nothing in the URL becomes part of a file path.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; side: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, side } = await params;
  if (side !== "front" && side !== "back") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [kyc, viewer] = await Promise.all([
    db.kyc.findUnique({ where: { id }, select: { userId: true, docFront: true, docBack: true } }),
    // Read the role fresh: the one in the session token stays valid after a demotion.
    db.user.findUnique({ where: { id: session.user.id }, select: { role: true } }),
  ]);

  // Same response whether the record is missing or belongs to someone else.
  if (!kyc || !viewer || (kyc.userId !== session.user.id && viewer.role !== "admin")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filename = side === "front" ? kyc.docFront : kyc.docBack;
  const buffer = filename ? await readKycFile(filename) : null;
  const type = buffer ? detectImageType(buffer) : null;
  if (!buffer || !type) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": type.mime,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
