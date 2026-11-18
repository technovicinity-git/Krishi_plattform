import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Best-effort client IP (first X-Forwarded-For hop, set by the host's proxy). */
export function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export interface Limit {
  bucket: string;
  limit: number;
  windowSeconds: number;
}

/**
 * Records a hit on each bucket and returns false if any is over its limit.
 * Fails open (allows) if the database can't be reached, so an outage doesn't
 * lock everyone out — the per-code attempt limits still apply. Server-only.
 */
export async function withinLimits(limits: Limit[]): Promise<boolean> {
  const db = createAdminClient();
  for (const l of limits) {
    const { data, error } = await db.rpc("hit_rate_limit", {
      p_bucket: l.bucket,
      p_limit: l.limit,
      p_window_seconds: l.windowSeconds,
    });
    if (error) {
      console.error("[rate-limit] check failed:", error.message);
      continue;
    }
    if (data === false) return false;
  }
  return true;
}

/** 429 response with a Retry-After hint. */
export function tooManyRequests(windowSeconds: number, message?: string) {
  const minutes = Math.ceil(windowSeconds / 60);
  return NextResponse.json(
    { error: message ?? `Too many attempts. Please try again in ${minutes} minutes.` },
    { status: 429, headers: { "Retry-After": String(windowSeconds) } },
  );
}

const MIN = 60;
const HOUR = 60 * MIN;

/** Limits per endpoint. IP limits stop floods; phone limits stop targeting one account. */
export const LIMITS = {
  login: (ip: string, phone: string): Limit[] => [
    { bucket: `login:ip:${ip}`, limit: 30, windowSeconds: 15 * MIN },
    { bucket: `login:phone:${phone}`, limit: 10, windowSeconds: 15 * MIN },
  ],
  register: (ip: string, phone: string): Limit[] => [
    { bucket: `register:ip:${ip}`, limit: 10, windowSeconds: HOUR },
    { bucket: `register:phone:${phone}`, limit: 5, windowSeconds: HOUR },
  ],
  forgotPassword: (ip: string): Limit[] => [
    { bucket: `forgot:ip:${ip}`, limit: 10, windowSeconds: HOUR },
  ],
  verifyCode: (ip: string): Limit[] => [
    { bucket: `verify:ip:${ip}`, limit: 30, windowSeconds: 15 * MIN },
  ],
  resetPassword: (ip: string): Limit[] => [
    { bucket: `reset:ip:${ip}`, limit: 10, windowSeconds: 15 * MIN },
  ],
  stewardRegister: (ip: string): Limit[] => [
    { bucket: `steward-register:ip:${ip}`, limit: 5, windowSeconds: HOUR },
  ],
  interest: (ip: string): Limit[] => [
    { bucket: `interest:ip:${ip}`, limit: 10, windowSeconds: HOUR },
  ],
};
