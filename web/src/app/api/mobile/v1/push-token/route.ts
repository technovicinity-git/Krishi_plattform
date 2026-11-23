import { requireMobileUser, json } from "@/lib/mobile/api";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function readToken(body: unknown): string | null {
  const token = (body as { token?: unknown } | null)?.token;
  return typeof token === "string" && token.length >= 20 && token.length <= 4096 ? token : null;
}

/**
 * POST {token, platform: "android"|"ios", locale: "bn"|"en"} — this phone
 * gets push notifications for the signed-in user. Called after sign-in, when
 * Firebase rotates the token, and when the app language changes. A token
 * moves to whoever signed in last on that phone.
 */
export async function POST(request: Request) {
  const user = await requireMobileUser();
  if (user instanceof Response) return user;
  const body = await request.json().catch(() => null);
  const token = readToken(body);
  const platform = (body as { platform?: string } | null)?.platform;
  const locale = (body as { locale?: string } | null)?.locale === "en" ? "en" : "bn";
  if (!token || (platform !== "android" && platform !== "ios")) {
    return json({ error: "token and platform are required" }, 400);
  }
  const { error } = await createAdminClient()
    .from("push_tokens")
    .upsert({ token, user_id: user.id, platform, locale, updated_at: new Date().toISOString() }, { onConflict: "token" });
  if (error) return json({ error: "Could not save" }, 500);
  return json({ ok: true });
}

/**
 * DELETE {token} — stop pushes to this phone (sign-out). Works without a
 * session, so a phone whose session expired can still unregister; it only
 * ever stops notifications.
 */
export async function DELETE(request: Request) {
  const token = readToken(await request.json().catch(() => null));
  if (!token) return json({ error: "token is required" }, 400);
  await createAdminClient().from("push_tokens").delete().eq("token", token);
  return json({ ok: true });
}
