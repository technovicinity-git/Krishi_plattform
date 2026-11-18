import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Private bucket for money-related images: deposit proofs, expense receipts,
 * update and sale photos, remittance proofs. Files are uploaded only by the
 * server and shown through short-lived signed URLs. Server-only.
 */
export const PRIVATE_FILES_BUCKET = "deposit-proofs";

/** How long a signed link stays valid. Pages are rendered per request. */
const URL_TTL_SECONDS = 60 * 60;

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type UploadResult = { ok: true; path: string | null } | { ok: false; error: string };

/**
 * Validates and uploads an optional image from a multipart form field into
 * `<folder>/`. Returns path=null when no file was sent.
 */
export async function uploadPrivateImage(
  value: FormDataEntryValue | null,
  folder: string,
): Promise<UploadResult> {
  if (!value || typeof value === "string" || value.size === 0) {
    return { ok: true, path: null };
  }
  if (!ALLOWED_TYPES.includes(value.type)) {
    return { ok: false, error: "Photo must be a JPG, PNG or WebP image" };
  }
  if (value.size > MAX_BYTES) {
    return { ok: false, error: "Photo is larger than 8 MB" };
  }

  const ext = value.type === "image/png" ? "png" : value.type === "image/webp" ? "webp" : "jpg";
  const path = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const { error } = await createAdminClient()
    .storage.from(PRIVATE_FILES_BUCKET)
    .upload(path, value, { contentType: value.type, upsert: false });

  if (error) {
    console.error("[uploadPrivateImage] failed:", error);
    return { ok: false, error: "Photo upload failed" };
  }
  return { ok: true, path };
}

/** Signed URLs for many stored paths at once. Missing/empty paths are skipped. */
export async function signFileUrls(
  paths: Array<string | null | undefined>,
): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter((p): p is string => Boolean(p)))];
  const urls = new Map<string, string>();
  if (unique.length === 0) return urls;

  const { data, error } = await createAdminClient()
    .storage.from(PRIVATE_FILES_BUCKET)
    .createSignedUrls(unique, URL_TTL_SECONDS);
  if (error || !data) {
    console.error("[signFileUrls] failed:", error);
    return urls;
  }
  for (const item of data) {
    if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
  }
  return urls;
}
