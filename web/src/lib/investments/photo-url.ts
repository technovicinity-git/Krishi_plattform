/**
 * Investment update photos and expense receipts live in the public
 * `deposit-proofs` bucket (under `updates/` and `receipts/`).
 * Safe to import from client components.
 */
export const UPDATE_PHOTO_BUCKET = "deposit-proofs";

export function updatePhotoUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/${UPDATE_PHOTO_BUCKET}/${path}`;
}
