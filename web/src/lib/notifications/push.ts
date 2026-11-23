import { importPKCS8, SignJWT } from "jose";
import { createAdminClient } from "@/lib/supabase/admin";
import { investmentIdFromHref, notificationText, translators, type MobileLocale } from "@/lib/mobile/api";

/**
 * Push notifications to the mobile app through Firebase Cloud Messaging
 * (HTTP v1). Needs FIREBASE_SERVICE_ACCOUNT: the service account key JSON
 * from Firebase (raw JSON or base64). Without it, pushes are skipped.
 */

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

function serviceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (!raw) return null;
  try {
    const text = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
    const sa = JSON.parse(text) as ServiceAccount;
    if (!sa.project_id || !sa.client_email || !sa.private_key) return null;
    // Env vars often keep "\n" escaped.
    return { ...sa, private_key: sa.private_key.replace(/\\n/g, "\n") };
  } catch {
    console.error("[push] FIREBASE_SERVICE_ACCOUNT is not valid JSON");
    return null;
  }
}

let cached: { token: string; expires: number } | null = null;

/** OAuth access token for FCM, cached until shortly before it expires. */
async function accessToken(sa: ServiceAccount): Promise<string> {
  if (cached && cached.expires > Date.now() + 60_000) return cached.token;
  const key = await importPKCS8(sa.private_key, "RS256");
  const now = Math.floor(Date.now() / 1000);
  const assertion = await new SignJWT({ scope: "https://www.googleapis.com/auth/firebase.messaging" })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(sa.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  if (!res.ok) throw new Error(`token ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: data.access_token, expires: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

export interface PushNotification {
  userId: string;
  kind: string;
  params: Record<string, string | number>;
  href: string | null;
}

/** True when the server has a usable Firebase key (pushes can be sent). */
export function pushConfigured(): boolean {
  return serviceAccount() !== null;
}

/** How many of these users have the app with notifications on (a registered phone). */
export async function usersWithPhones(userIds: string[] | "all", role?: string): Promise<number> {
  const db = createAdminClient();
  if (userIds === "all") {
    const found = new Set<string>();
    // Page through: at most 1,000 rows per request.
    for (let from = 0; ; from += 1000) {
      let q = db
        .from("push_tokens")
        .select("user_id, users!inner ( role, status )")
        .eq("users.status", "active")
        .neq("users.role", "admin");
      if (role) q = q.eq("users.role", role);
      const { data } = await q.order("token").range(from, from + 999);
      for (const r of data ?? []) found.add(r.user_id);
      if ((data ?? []).length < 1000) break;
    }
    return found.size;
  }
  const found = new Set<string>();
  for (let i = 0; i < userIds.length; i += 150) {
    const { data } = await db.from("push_tokens").select("user_id").in("user_id", userIds.slice(i, i + 150));
    for (const r of data ?? []) found.add(r.user_id);
  }
  return found.size;
}

export interface PushResult {
  /** Phones the message was delivered to Firebase for. */
  sent: number;
  /** Phones that failed (other than uninstalled apps, which are removed). */
  failed: number;
}

/**
 * Sends each notification to every phone its user is signed in on, in that
 * phone's language. Tokens Firebase no longer knows are removed. Never throws.
 */
export async function sendPush(items: PushNotification[]): Promise<PushResult> {
  const result: PushResult = { sent: 0, failed: 0 };
  const sa = serviceAccount();
  if (!sa || items.length === 0) return result;
  try {
    const db = createAdminClient();
    // A few hundred IDs per query, so the request URL stays short.
    const userIds = [...new Set(items.map((i) => i.userId))];
    const tokens: { token: string; user_id: string; platform: string; locale: string }[] = [];
    for (let i = 0; i < userIds.length; i += 150) {
      const { data } = await db
        .from("push_tokens")
        .select("token, user_id, platform, locale")
        .in("user_id", userIds.slice(i, i + 150));
      tokens.push(...(data ?? []));
    }
    if (!tokens.length) return result;

    const bearer = await accessToken(sa);
    const t = { bn: await translators("bn"), en: await translators("en") };
    const dead: string[] = [];

    const jobs = items.flatMap((n) =>
      tokens
        .filter((tk) => tk.user_id === n.userId)
        .map((tk) => async () => {
            const locale: MobileLocale = tk.locale === "en" ? "en" : "bn";
            const { title, body } = notificationText(t[locale], locale, n);
            const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
              method: "POST",
              headers: { Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                message: {
                  token: tk.token,
                  notification: { title, body: body || undefined },
                  // What the app opens when the notification is tapped.
                  data: {
                    kind: n.kind,
                    href: n.href ?? "",
                    investmentId: investmentIdFromHref(n.href) ?? "",
                  },
                  android: { priority: "high", notification: { channel_id: "krishi_updates", color: "#3A7D44" } },
                  apns: { payload: { aps: { sound: "default" } } },
                },
              }),
            });
            if (res.ok) {
              result.sent += 1;
              return;
            }
            const text = await res.text();
            // The app was removed or the token was replaced.
            if (res.status === 404 || text.includes("UNREGISTERED") || text.includes("registration-token-not-registered")) {
              dead.push(tk.token);
            } else {
              result.failed += 1;
              console.error(`[push] ${n.kind} failed (${res.status}):`, text.slice(0, 300));
            }
          }),
    );
    // A few dozen at a time, so a message to everyone does not open
    // thousands of connections at once.
    for (let i = 0; i < jobs.length; i += 50) {
      await Promise.allSettled(jobs.slice(i, i + 50).map((job) => job()));
    }
    if (dead.length) await db.from("push_tokens").delete().in("token", dead);
  } catch (err) {
    console.error("[push] failed:", err);
  }
  return result;
}
