/**
 * Compresses an image File using the browser's canvas API.
 * Returns a new File with reduced size. Non-images and files already
 * below the threshold are returned unchanged.
 *
 * Strategy:
 *   - Max dimension: 1600px (long edge)
 *   - Output format: JPEG, quality 0.85
 *   - Target size: under 1MB for typical KYC documents
 */
export async function compressImage(
  file: File,
  maxDimension = 1600,
  targetMb = 1,
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.size < targetMb * 1024 * 1024) return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(bitmap, 0, 0, width, height);

  return new Promise<File>((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(file);
          return;
        }
        const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
        resolve(new File([blob], name, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.85,
    );
  });
}