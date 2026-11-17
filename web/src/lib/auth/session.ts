import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifySession, signSession, type SessionPayload } from "./jwt";

export const SESSION_COOKIE = "krishi_session";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const isProd = process.env.NODE_ENV === "production";

/** Read + verify the current session from cookies (server-side). */
export async function getSessionFromCookie(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
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