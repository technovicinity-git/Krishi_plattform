import { cache } from "react";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  verifySession,
  signSession,
  MOBILE_SESSION_TTL,
  ADMIN_SESSION_TTL,
  ADMIN_SESSION_SECONDS,
  type SessionPayload,
} from "./jwt";

export const SESSION_COOKIE = "krishi_session";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const isProd = process.env.NODE_ENV === "production";

/** Accounts that must not be used, even with a valid token. */
const BLOCKED_STATUSES = ["suspended", "deleted"];

/**
 * Read + verify the current session (server-side): the website's cookie, or
 * for the mobile app an `Authorization: Bearer <token>` header carrying the
 * same signed session token.
 *
 * A signed token alone is not enough: the account must still be usable (not
 * suspended or deleted) and the token must not have been signed out (its
 * session version must be current). Checked once per request.
 */
export const getSessionFromCookie = cache(async (): Promise<SessionPayload | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value ?? (await bearerToken());
  if (!token) return null;
  const payload = await verifySession(token);
  if (!payload) return null;

  const { data: user } = await createAdminClient()
    .from("users")
    .select("status, session_version")
    .eq("id", payload.sub)
    .maybeSingle();
  if (!user || BLOCKED_STATUSES.includes(user.status)) return null;
  if ((payload.v ?? 0) !== (user.session_version ?? 0)) return null;
  return payload;
});

async function bearerToken(): Promise<string | null> {
  const auth = (await headers()).get("authorization");
  const match = auth?.match(/^Bearer\s+(\S+)$/i);
  return match ? match[1] : null;
}

/** The user's current session version, stamped into every new token. */
async function currentVersion(userId: string): Promise<number> {
  const { data } = await createAdminClient().from("users").select("session_version").eq("id", userId).maybeSingle();
  return data?.session_version ?? 0;
}

/**
 * Ends every session of a user (all browsers and phones): password change or
 * reset, "sign out of all devices". Returns the new version, to sign the
 * current device back in when wanted.
 */
export async function endAllSessions(userId: string): Promise<number> {
  const { data, error } = await createAdminClient().rpc("bump_session_version", { p_user_id: userId });
  if (error) throw error;
  return Number(data ?? 0);
}

/** Attach a signed session cookie to a NextResponse. Admin sessions are short. */
export async function setSessionCookie(
  response: NextResponse,
  payload: SessionPayload,
): Promise<void> {
  const v = payload.v ?? (await currentVersion(payload.sub));
  const admin = payload.role === "admin";
  const token = await signSession({ ...payload, v }, admin ? ADMIN_SESSION_TTL : undefined);

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: admin ? ADMIN_SESSION_SECONDS : COOKIE_MAX_AGE,
    path: "/",
  });
}

/** A token for the mobile app (kept in the phone's secure storage). */
export async function mobileToken(payload: SessionPayload): Promise<string> {
  const v = payload.v ?? (await currentVersion(payload.sub));
  return signSession({ ...payload, v }, MOBILE_SESSION_TTL);
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
    const token = await mobileToken(payload);
    return NextResponse.json({ ...body, role: payload.role, token });
  }
  const response = NextResponse.json(body);
  await setSessionCookie(response, payload);
  return response;
}
