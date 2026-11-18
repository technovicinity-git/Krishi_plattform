import { createAdminClient } from "@/lib/supabase/admin";

import { UPDATE_PHOTO_BUCKET } from "./photo-url";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type PhotoUploadResult =
  | { ok: true; path: string | null }
  | { ok: false; error: string };

/**
 * Validates and uploads an optional photo from a multipart form field.
 * Returns path=null when no file was sent. Server-only.
 */
export async function uploadUpdatePhoto(
  value: FormDataEntryValue | null,
  investmentId: string,
  folder: "updates" | "receipts" | "sales" | "remittances" = "updates",
): Promise<PhotoUploadResult> {
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
  const path = `${folder}/${investmentId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const db = createAdminClient();
  const { error } = await db.storage
    .from(UPDATE_PHOTO_BUCKET)
    .upload(path, value, { contentType: value.type, upsert: false });

  if (error) {
    console.error("[uploadUpdatePhoto] failed:", error);
    return { ok: false, error: "Photo upload failed" };
  }
  return { ok: true, path };
}
