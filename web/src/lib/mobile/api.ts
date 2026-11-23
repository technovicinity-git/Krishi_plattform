import { NextResponse } from "next/server";
import { createTranslator } from "next-intl";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatBDT } from "@/lib/utils";
import { localizeUpdate, type TimelineI18n } from "@/lib/investments/timeline";

/**
 * Helpers for the mobile app's JSON API (/api/mobile/v1/*). The app signs in
 * with a bearer token (see lib/auth/session.ts) and asks for text in its
 * language with `Accept-Language: bn|en` (or `?locale=`). Server-only.
 */

export type MobileLocale = "bn" | "en";
export type MobileUser = CurrentUser & { role: "investor" | "steward" | "farmer" };

export function localeOf(request: Request): MobileLocale {
  const q = new URL(request.url).searchParams.get("locale");
  if (q === "en" || q === "bn") return q;
  return (request.headers.get("accept-language") ?? "").toLowerCase().startsWith("en") ? "en" : "bn";
}

/** The signed-in investor, steward or farmer, or a 401/403 response. */
export async function requireMobileUser(): Promise<MobileUser | NextResponse> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "admin") return NextResponse.json({ error: "Admins use the Krishi console" }, { status: 403 });
  if (user.status === "suspended" || user.status === "deleted") {
    return NextResponse.json({ error: "This account is not accessible" }, { status: 403 });
  }
  return user as MobileUser;
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

/** IDs of the batches this user takes part in, newest first. */
export async function investmentIdsFor(user: MobileUser): Promise<string[]> {
  const db = createAdminClient();
  if (user.role === "steward") {
    const { data } = await db
      .from("investments")
      .select("id, offering:steward_plan_offerings!offering_id!inner ( steward_id )")
      .eq("offering.steward_id", user.id)
      .order("created_at", { ascending: false });
    return (data ?? []).map((r) => r.id);
  }
  const { data } = await db
    .from("investments")
    .select("id")
    .eq(user.role === "farmer" ? "farmer_id" : "investor_id", user.id)
    .order("created_at", { ascending: false });
  return (data ?? []).map((r) => r.id);
}

type Messages = Record<string, unknown>;
const cache = new Map<MobileLocale, Messages>();

export async function messagesFor(locale: MobileLocale): Promise<Messages> {
  const hit = cache.get(locale);
  if (hit) return hit;
  const messages = (await import(`../../messages/${locale}.json`)).default as Messages;
  cache.set(locale, messages);
  return messages;
}

/** A translator for one namespace, with keys built at runtime. */
type Translate = ((key: string, values?: Record<string, string | number>) => string) & {
  has: (key: string) => boolean;
};

export async function translators(locale: MobileLocale) {
  const messages = await messagesFor(locale);
  const ns = (namespace: string) => createTranslator({ locale, messages, namespace }) as unknown as Translate;
  return {
    tTimeline: ns("app.timeline"),
    tPurpose: ns("app.purpose"),
    tNotify: ns("app.notify"),
  };
}

/** Title/body of a timeline entry in the reader's language. */
export function timelineText(
  t: Awaited<ReturnType<typeof translators>>,
  u: { title: string; body: string | null; metadata?: unknown },
) {
  const i18n = ((u.metadata ?? {}) as { i18n?: TimelineI18n }).i18n ?? null;
  return localizeUpdate({ title: u.title, body: u.body, i18n }, t.tTimeline, t.tPurpose, formatBDT);
}

/** Title/body of a notification in the reader's language (same rules as the web bell). */
export function notificationText(
  t: Awaited<ReturnType<typeof translators>>,
  locale: MobileLocale,
  n: { kind: string; params: Record<string, string | number> },
) {
  const p = n.params;
  // Written by an admin: the text itself, in the reader's language if given.
  if (n.kind === "custom") {
    const bn = locale === "bn";
    return {
      title: String((bn && p.titleBn) || p.title || ""),
      body: String((bn && p.bodyBn) || p.body || ""),
    };
  }
  const values: Record<string, string> = {
    reference: String(p.reference ?? ""),
    name: String(p.name ?? ""),
    plan: String((locale === "bn" ? p.planBn : p.plan) ?? p.plan ?? ""),
    reason: String(p.reason ?? ""),
    title: String(p.title ?? ""),
    amount: typeof p.amount === "number" ? formatBDT(p.amount) : String(p.amount ?? ""),
  };
  if (!t.tNotify.has(`${n.kind}.title`)) return { title: n.kind, body: "" };
  return {
    title: t.tNotify(`${n.kind}.title`, values),
    body: t.tNotify.has(`${n.kind}.body`) ? t.tNotify(`${n.kind}.body`, values) : "",
  };
}

/** "/portal/investments/<id>" → "<id>": lets the app open the batch a notification is about. */
export function investmentIdFromHref(href: string | null): string | null {
  const m = href?.match(/\/investments\/([0-9a-f-]{36})/);
  return m ? m[1] : null;
}
