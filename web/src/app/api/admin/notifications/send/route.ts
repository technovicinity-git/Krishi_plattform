import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/lib/admin/current-admin";
import { logAdminAction } from "@/lib/admin/audit";
import { notify } from "@/lib/notifications/notify";
import { pushConfigured, sendPush } from "@/lib/notifications/push";

export const runtime = "nodejs";
// A message to everyone sends one push per phone.
export const maxDuration = 60;

const optional = (max: number) =>
  z.string().trim().max(max).optional().transform((v) => (v ? v : undefined));

const schema = z
  .object({
    audience: z.enum(["all", "investor", "steward", "farmer", "user"]),
    // both: in the notification list and a push; inapp: list only; push: phones only.
    channels: z.enum(["both", "inapp", "push"]).default("both"),
    userId: z.string().uuid().optional(),
    titleEn: z.string().trim().min(2, "Write a title").max(80),
    titleBn: optional(80),
    bodyEn: z.string().trim().min(2, "Write a message").max(500),
    bodyBn: optional(500),
  })
  .refine((d) => d.audience !== "user" || Boolean(d.userId), { message: "Choose a person", path: ["userId"] });

/**
 * POST — sends a notification written by an admin to a group or one person,
 * in-app (bell / app list), as a push to their phones, or both; in each
 * reader's language when a Bangla version is given. Only active accounts
 * receive it.
 */
export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const d = parsed.data;
  if (d.channels === "push" && !pushConfigured()) {
    return NextResponse.json(
      { error: "Push notifications are not set up on the server (FIREBASE_SERVICE_ACCOUNT)." },
      { status: 400 },
    );
  }
  const db = createAdminClient();

  // Page through: the API returns at most 1,000 rows per request.
  const ids: string[] = [];
  for (let from = 0; ; from += 1000) {
    let query = db.from("users").select("id").eq("status", "active").neq("role", "admin");
    if (d.audience === "user") query = query.eq("id", d.userId!);
    else if (d.audience !== "all") query = query.eq("role", d.audience);
    const { data: page, error } = await query.order("id").range(from, from + 999);
    if (error) {
      console.error("[admin/notifications/send] recipients failed:", error);
      return NextResponse.json({ error: "Could not load recipients" }, { status: 500 });
    }
    ids.push(...(page ?? []).map((u) => u.id));
    if ((page ?? []).length < 1000) break;
  }
  if (ids.length === 0) {
    return NextResponse.json({ error: "Nobody to send to: no active accounts match." }, { status: 400 });
  }

  const params = { title: d.titleEn, titleBn: d.titleBn, body: d.bodyEn, bodyBn: d.bodyBn };
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v)) as Record<string, string>;
  let pushed = 0;
  let pushFailed = 0;
  // In chunks, so each insert and push batch stays small.
  for (let i = 0; i < ids.length; i += 500) {
    const chunk = ids.slice(i, i + 500);
    if (d.channels !== "push") {
      await notify("custom", chunk.map((userId) => ({ userId })), params, { push: false });
    }
    if (d.channels !== "inapp") {
      const r = await sendPush(chunk.map((userId) => ({ userId, kind: "custom", params: clean, href: null })));
      pushed += r.sent;
      pushFailed += r.failed;
    }
  }

  const { data: row } = await db
    .from("notification_broadcasts")
    .insert({
      admin_id: admin.id,
      audience: d.audience,
      user_id: d.audience === "user" ? d.userId : null,
      title_en: d.titleEn,
      title_bn: d.titleBn ?? null,
      body_en: d.bodyEn,
      body_bn: d.bodyBn ?? null,
      recipients: ids.length,
      channels: d.channels,
      pushed,
    })
    .select("id")
    .single();

  await logAdminAction({
    adminId: admin.id,
    action: "notification.sent",
    targetType: "notification_broadcast",
    targetId: row?.id,
    metadata: { audience: d.audience, channels: d.channels, userId: d.userId ?? null, title: d.titleEn, recipients: ids.length, pushed },
    request,
  });

  return NextResponse.json({
    ok: true,
    recipients: ids.length,
    pushed,
    pushFailed,
    pushConfigured: pushConfigured(),
  });
}
