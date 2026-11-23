import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { verifySession, signSession, MOBILE_SESSION_TTL, type SessionPayload } from "./jwt";

export const SESSION_COOKIE = "krishi_session";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const isProd = process.env.NODE_ENV === "production";

/**
 * Read + verify the current session (server-side): the website's cookie, or
 * for the mobile app an `Authorization: Bearer <token>` header carrying the
 * same signed session token.
 */
export async function getSessionFromCookie(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value ?? (await bearerToken());
  if (!token) return null;
  return verifySession(token);
}

async function bearerToken(): Promise<string | null> {
  const auth = (await headers()).get("authorization");
  const match = auth?.match(/^Bearer\s+(\S+)$/i);
  return match ? match[1] : null;
}

/** Attach a signed session cookie to a NextResponse. */
export async function setSessionCookie(
  response: NextResponse,
  payload: SessionPayload,
): Promise<void> {
  const token = await signSession(payload);

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

/** Clear the session cookie. */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}
/** True when the request comes from the mobile app (it sends X-Krishi-Client: mobile). */
export function isMobileClient(request: Request): boolean {
  return request.headers.get("x-krishi-client") === "mobile";
}

/**
 * Signs the person in. The website gets the session cookie; the mobile app
 * gets the token in the JSON body (it keeps it in secure storage and sends it
 * as a bearer token).
 */
export async function signedInResponse(
  request: Request,
  body: Record<string, unknown>,
  payload: SessionPayload,
): Promise<NextResponse> {
  if (isMobileClient(request)) {
    const token = await signSession(payload, MOBILE_SESSION_TTL);
    return NextResponse.json({ ...body, role: payload.role, token });
  }
  const response = NextResponse.json(body);
  await setSessionCookie(response, payload);
  return response;
}
