import { SignJWT, jwtVerify } from "jose";

let cachedKey: Uint8Array | null = null;

/**
 * Session signing key. Refuses to run without a strong secret in every
 * environment — a missing secret in production would otherwise sign tokens
 * with the string "undefined", letting anyone forge a session. Read lazily so
 * `next build` doesn't need the secret.
 */
function getKey(): Uint8Array {
  if (cachedKey) return cachedKey;
  const secret = process.env.KRISHI_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "KRISHI_SESSION_SECRET is missing or too short (min 32 chars). " +
        "See docs/development.md for how to generate one.",
    );
  }
  cachedKey = new TextEncoder().encode(secret);
  return cachedKey;
}

export type UserRole = "investor" | "steward" | "farmer" | "admin";

export interface SessionPayload {
  /** User UUID (public.users.id) */
  sub: string;
  role: UserRole;
  /**
   * The user's session_version when the token was issued. A token older than
   * the current version has been signed out (password change, sign out of all
   * devices). Missing on tokens issued before versions existed: treated as 0.
   */
  v?: number;
}

const SESSION_TTL = "7d";
/** Admins hold the keys to money: their sessions are short. */
export const ADMIN_SESSION_TTL = "12h";
export const ADMIN_SESSION_SECONDS = 12 * 60 * 60;
/** The mobile app keeps people signed in longer; the token lives in secure storage. */
export const MOBILE_SESSION_TTL = "30d";

export async function signSession(payload: SessionPayload, ttl: string = SESSION_TTL): Promise<string> {
  return new SignJWT({ role: payload.role, v: payload.v ?? 0 })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(getKey());
}

export async function verifySession(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getKey(), {
      algorithms: ["HS256"],
    });

    if (
      typeof payload.sub !== "string" ||
      typeof payload.role !== "string" ||
      !["investor", "steward", "farmer", "admin"].includes(payload.role)
    ) {
      return null;
    }

    return {
      sub: payload.sub,
      role: payload.role as UserRole,
      v: typeof payload.v === "number" ? payload.v : 0,
    };
  } catch {
    return null;
  }
}