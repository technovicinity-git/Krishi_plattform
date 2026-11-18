/** Public base URL of the app, for gateway callbacks and redirects. */
export function appBaseUrl(request: Request): string {
  const fromEnv = process.env.APP_URL?.trim().replace(/\/+$/, "");
  if (fromEnv) return fromEnv;
  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
  return `${proto}://${host}`;
}

/** App path with the locale prefix ("bn" is the unprefixed default). */
export function localePath(locale: string, path: string): string {
  return locale === "en" ? `/en${path}` : path;
}
