import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/lib/admin/current-admin";
import { logAdminAction } from "@/lib/admin/audit";
import { endAllSessions } from "@/lib/auth/session";

export const runtime = "nodejs";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("suspend"), reason: z.string().trim().min(5, "Give a reason (at least 5 characters)").max(500) }),
  z.object({ action: z.literal("restore"), reason: z.string().trim().max(500).optional() }),
]);

/**
 * POST {action: "suspend", reason} | {action: "restore", reason?}
 *
 * Suspend: the account stops working at once (every session ends and every
 * request is refused) until an admin restores it. Restore: back to active,
 * or to "pending activation" for a farmer who never set a password.
 * Admin accounts are not managed here.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { id } = await params;
  const db = createAdminClient();
  const { data: user } = await db
    .from("users")
    .select("id, role, status, password_hash, full_name")
    .eq("id", id)
    .maybeSingle();
  if (!user) return NextResponse.json({ error: "Account not found" }, { status: 404 });
  if (user.role === "admin") return NextResponse.json({ error: "Admin accounts cannot be suspended here" }, { status: 400 });
  if (user.status === "deleted") return NextResponse.json({ error: "This account was deleted" }, { status: 400 });

  const suspend = parsed.data.action === "suspend";
  if (suspend && user.status === "suspended") return NextResponse.json({ error: "Already suspended" }, { status: 409 });
  if (!suspend && user.status !== "suspended") return NextResponse.json({ error: "This account is not suspended" }, { status: 409 });

  const nextStatus = suspend ? "suspended" : user.password_hash ? "active" : "pending_activation";
  const { error } = await db
    .from("users")
    .update({
      status: nextStatus,
      status_reason: parsed.data.reason || null,
      status_changed_at: new Date().toISOString(),
      status_changed_by: admin.id,
    })
    .eq("id", id);
  if (error) {
    console.error("[admin/users/status] update failed:", error);
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }
  // Sign them out everywhere now, not just when their token expires.
  if (suspend) await endAllSessions(id);

  await logAdminAction({
    adminId: admin.id,
    action: suspend ? "user.suspended" : "user.restored",
    targetType: user.role,
    targetId: id,
    metadata: { name: user.full_name, reason: parsed.data.reason ?? null, from: user.status, to: nextStatus },
    request,
  });

  return NextResponse.json({ ok: true, status: nextStatus });
}
