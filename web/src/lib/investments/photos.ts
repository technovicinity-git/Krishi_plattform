import { uploadPrivateImage, type UploadResult } from "@/lib/storage/private-files";

export type PhotoUploadResult = UploadResult;

/**
 * Validates and uploads an optional photo for an investment from a multipart
 * form field into private storage. Returns path=null when no file was sent.
 * Server-only.
 */
export async function uploadUpdatePhoto(
  value: FormDataEntryValue | null,
  investmentId: string,
  folder: "updates" | "receipts" | "sales" | "remittances" = "updates",
): Promise<PhotoUploadResult> {
  return uploadPrivateImage(value, `${folder}/${investmentId}`);
}
