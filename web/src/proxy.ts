import createMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  // The admin console is not localized: /en/krishi-console/... -> /krishi-console/...
  const consolePath = request.nextUrl.pathname.match(/^\/(?:en|bn)(\/krishi-console(?:\/.*)?)$/);
  if (consolePath) {
    const url = request.nextUrl.clone();
    url.pathname = consolePath[1];
    return NextResponse.redirect(url);
  }

  const response = intlMiddleware(request);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Exclude: API, Next internals, admin console, and static files.
  matcher: ["/((?!api|_next|_vercel|krishi-console|.*\\..*).*)"],
};