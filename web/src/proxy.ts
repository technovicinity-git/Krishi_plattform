import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

/**
 * Runs before every page request: picks the language (Bangla without a
 * prefix, English under /en). Sessions are the app's own signed cookie
 * (lib/auth/session.ts); Supabase Auth is not used.
 */
export default function proxy(request: NextRequest) {
  // The admin console is not localized: /en/krishi-console/... -> /krishi-console/...
  const consolePath = request.nextUrl.pathname.match(/^\/(?:en|bn)(\/krishi-console(?:\/.*)?)$/);
  if (consolePath) {
    const url = request.nextUrl.clone();
    url.pathname = consolePath[1];
    return NextResponse.redirect(url);
  }

  return intlMiddleware(request);
}

export const config = {
  // Exclude: API, Next internals, admin console, and static files.
  matcher: ["/((?!api|_next|_vercel|krishi-console|.*\\..*).*)"],
};
