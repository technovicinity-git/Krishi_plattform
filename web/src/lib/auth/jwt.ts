import { SignJWT, jwtVerify } from "jose";

const secret = process.env.KRISHI_SESSION_SECRET;

if (!secret || secret.length < 32) {
  // Fail loudly in dev so we never accidentally ship a weak secret.
  if (process.env.NODE_ENV !== "production") {
    throw new Error(
      "KRISHI_SESSION_SECRET is missing or too short (min 32 chars). " +
      "See .env.example for how to generate one.",
    );
  }
}

const key = new TextEncoder().encode(secret!);

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
    .sign(key);
}

export async function verifySession(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
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