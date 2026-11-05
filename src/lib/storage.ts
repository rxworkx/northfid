import { mkdir, readFile, writeFile, unlink } from "fs/promises";
import { basename, join, dirname } from "path";

// Files are stored on the local filesystem under public/<bucket>/<path>,
// which Next.js serves statically at /<bucket>/<path>.
const PUBLIC_DIR = join(process.cwd(), "public");

// Identity documents live outside public/ so they can only be reached through
// the permission-checked route at /api/kyc-documents/[id]/[side].
const KYC_DIR = join(
  process.env.PRIVATE_UPLOADS_DIR ?? join(process.cwd(), "private-uploads"),
  "kyc"
);

export type ImageType = { ext: string; mime: string };

// Identifies an image from its leading bytes. The browser-supplied MIME type and
// filename are controlled by the uploader, so neither can be trusted.
export function detectImageType(buffer: Buffer): ImageType | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: ".jpg", mime: "image/jpeg" };
  }
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { ext: ".png", mime: "image/png" };
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("latin1") === "RIFF" &&
    buffer.subarray(8, 12).toString("latin1") === "WEBP"
  ) {
    return { ext: ".webp", mime: "image/webp" };
  }
  return null;
}

export async function saveKycFile(filename: string, buffer: Buffer): Promise<void> {
  await mkdir(KYC_DIR, { recursive: true });
  await writeFile(join(KYC_DIR, basename(filename)), buffer);
}

export async function readKycFile(filename: string): Promise<Buffer | null> {
  return readFile(join(KYC_DIR, basename(filename))).catch(() => null);
}

export async function uploadFile(
  bucket: string,
  path: string,
  buffer: Buffer,
  _contentType: string
): Promise<string> {
  const fullPath = join(PUBLIC_DIR, bucket, path);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, buffer);
  return `/${bucket}/${path}`;
}

export async function deleteFile(bucket: string, path: string) {
  await unlink(join(PUBLIC_DIR, bucket, path)).catch(() => {});
}

export function resolveStorageUrl(filename: string | null | undefined, folder: string): string | null {
  if (!filename) return null;
  if (filename.startsWith("http")) return filename;
  return `/uploads/${folder}/${filename}`;
}
