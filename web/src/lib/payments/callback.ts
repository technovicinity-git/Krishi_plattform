/** Reads SSLCommerz callback fields from a form POST (or query string). */
export async function readGatewayFields(request: Request): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  new URL(request.url).searchParams.forEach((v, k) => (out[k] = v));
  if (request.method === "POST") {
    try {
      const form = await request.formData();
      form.forEach((v, k) => {
        if (typeof v === "string") out[k] = v;
      });
    } catch {
      // Not a form body; query string only.
    }
  }
  return out;
}
