import { createAdminClient } from "@/lib/supabase/admin";

interface LogInput {
  adminId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  request?: Request;
}

/**
 * Writes an admin action to the audit log.
 * Never throws — a failed log must not break the admin flow.
 */
export async function logAdminAction({
  adminId,
  action,
  targetType,
  targetId,
  metadata,
  request,
}: LogInput): Promise<void> {
  try {
    const admin = createAdminClient();
    const ip = request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ua = request?.headers.get("user-agent") ?? undefined;

    await admin.from("admin_audit_log").insert({
      admin_id: adminId,
      action,
      target_type: targetType ?? null,
      target_id: targetId ?? null,
      metadata: metadata ?? null,
      ip_address: ip ?? null,
      user_agent: ua ?? null,
    });
  } catch (err) {
    console.error("[audit] failed to log:", err);
  }
}