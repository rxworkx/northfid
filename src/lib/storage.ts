import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function uploadFile(
  bucket: string,
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType, upsert: true });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteFile(bucket: string, path: string) {
  await supabase.storage.from(bucket).remove([path]);
}

export function resolveStorageUrl(filename: string | null | undefined, folder: string): string | null {
  if (!filename) return null;
  if (filename.startsWith("http")) return filename;
  return `${process.env.SUPABASE_URL}/storage/v1/object/public/uploads/${folder}/${filename}`;
}
