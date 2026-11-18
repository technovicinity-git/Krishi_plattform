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
}

const SESSION_TTL = "7d";

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
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
    };
  } catch {
    return null;
  }
}