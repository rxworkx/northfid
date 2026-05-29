import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { extname } from "path";
import { uploadFile } from "@/lib/storage";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 8 * 1024 * 1024;

async function saveFile(file: File, userId: string, label: string): Promise<string> {
  const ext = extname(file.name) || ".jpg";
  const filename = `kyc_${userId}_${label}_${Date.now()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await uploadFile("uploads", `kyc/${filename}`, buffer, file.type);
  return filename;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const formData = await req.formData();

  const firstName    = (formData.get("firstName")    as string | null)?.trim();
  const lastName     = (formData.get("lastName")     as string | null)?.trim();
  const dateOfBirth  = (formData.get("dateOfBirth")  as string | null)?.trim();
  const nationality  = (formData.get("nationality")  as string | null)?.trim();
  const addressLine1 = (formData.get("addressLine1") as string | null)?.trim();
  const addressLine2 = (formData.get("addressLine2") as string | null)?.trim() || null;
  const city         = (formData.get("city")         as string | null)?.trim();
  const state        = (formData.get("state")        as string | null)?.trim() || null;
  const postalCode   = (formData.get("postalCode")   as string | null)?.trim();
  const country      = (formData.get("country")      as string | null)?.trim();
  const docType      = (formData.get("docType")      as string | null)?.trim();
  const docNumber    = (formData.get("docNumber")    as string | null)?.trim();
  const docIssueDate = (formData.get("docIssueDate") as string | null)?.trim();
  const docExpiryDate= (formData.get("docExpiryDate")as string | null)?.trim();
  const docFrontFile = formData.get("docFront") as File | null;
  const docBackFile  = formData.get("docBack")  as File | null;

  const required = { firstName, lastName, dateOfBirth, nationality, addressLine1, city, postalCode, country, docType, docNumber, docIssueDate, docExpiryDate };
  for (const [key, val] of Object.entries(required)) {
    if (!val) return NextResponse.json({ error: `Missing field: ${key}` }, { status: 400 });
  }
  if (!docFrontFile) return NextResponse.json({ error: "Front of ID is required" }, { status: 400 });
  if (docType !== "passport" && !docBackFile) return NextResponse.json({ error: "Back of ID is required" }, { status: 400 });

  for (const [label, file] of [["docFront", docFrontFile], ["docBack", docBackFile]] as [string, File | null][]) {
    if (!file) continue;
    if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: `${label}: only JPEG/PNG/WEBP allowed` }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: `${label}: max 8 MB` }, { status: 400 });
  }

  const docFront = await saveFile(docFrontFile!, userId, "front");
  const docBack  = docBackFile ? await saveFile(docBackFile, userId, "back") : null;

  await db.kyc.upsert({
    where: { userId },
    create: {
      userId, status: "pending",
      firstName, lastName, dateOfBirth, nationality,
      addressLine1, addressLine2, city, state, postalCode, country,
      docType, docNumber, docIssueDate, docExpiryDate,
      docFront, docBack,
    },
    update: {
      status: "pending",
      firstName, lastName, dateOfBirth, nationality,
      addressLine1, addressLine2, city, state, postalCode, country,
      docType, docNumber, docIssueDate, docExpiryDate,
      docFront, docBack,
      rejectionReason: null, reviewedAt: null,
    },
  });

  return NextResponse.json({ success: true });
}
