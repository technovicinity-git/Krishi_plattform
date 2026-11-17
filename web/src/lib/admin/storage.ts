import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "kyc-documents";
const URL_TTL_SECONDS = 60 * 60; // 1 hour

export interface SignedKycUrls {
  nidFront: string | null;
  nidBack: string | null;
  profile: string | null;
}

/**
 * Generates short-lived signed URLs for a KYC submission's documents.
 * The bucket is private, so documents are only viewable via these URLs.
 */
export async function getSignedKycUrls(paths: {
  nidFront?: string | null;
  nidBack?: string | null;
  profile?: string | null;
}): Promise<SignedKycUrls> {
  const admin = createAdminClient();
  const result: SignedKycUrls = { nidFront: null, nidBack: null, profile: null };

  const entries = [
    { key: "nidFront" as const, path: paths.nidFront },
    { key: "nidBack" as const, path: paths.nidBack },
    { key: "profile" as const, path: paths.profile },
  ].filter((e): e is { key: "nidFront" | "nidBack" | "profile"; path: string } =>
    Boolean(e.path),
  );

  if (entries.length === 0) return result;

  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrls(
      entries.map((e) => e.path),
      URL_TTL_SECONDS,
    );

  if (error || !data) {
    console.error("[storage] signed url error:", error);
    return result;
  }

  data.forEach((item) => {
    const match = entries.find((e) => e.path === item.path);
    if (match && item.signedUrl) {
      result[match.key] = item.signedUrl;
    }
  });

  return result;
}