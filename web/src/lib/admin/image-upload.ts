const COMPRESS_THRESHOLD_BYTES = 800 * 1024; // 800 KB

/**
 * Server-side image compression using the browser's canvas is not available.
 * For server routes we simply return the file as-is — the client-side form
 * will compress before upload where practical.
 *
 * This helper exists so we can swap in a server-side compressor (e.g. sharp)
 * later without touching every call site.
 */
export async function compressIfNeeded(file: File): Promise<File> {
  if (file.size <= COMPRESS_THRESHOLD_BYTES) return file;
  return file;
}