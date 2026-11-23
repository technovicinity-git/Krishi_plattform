import { createAdminClient } from "@/lib/supabase/admin";

export interface AccountStatusInfo {
  status: string;
  reason: string | null;
  changedAt: string | null;
  /** Name of the admin who last suspended or restored the account. */
  changedBy: string | null;
}

/** An account's status and the last suspend/restore, for the console. Server-only. */
export async function getAccountStatus(userId: string): Promise<AccountStatusInfo | null> {
  const db = createAdminClient();
  const { data } = await db
    .from("users")
    .select("status, status_reason, status_changed_at, status_changed_by")
    .eq("id", userId)
    .maybeSingle();
  if (!data) return null;
  let changedBy: string | null = null;
  if (data.status_changed_by) {
    const { data: by } = await db.from("users").select("full_name").eq("id", data.status_changed_by).maybeSingle();
    changedBy = by?.full_name ?? null;
  }
  return { status: data.status, reason: data.status_reason, changedAt: data.status_changed_at, changedBy };
}
