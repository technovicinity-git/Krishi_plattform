import { requireMobileUser, json } from "@/lib/mobile/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUnreadCount } from "@/lib/notifications/read";

export const runtime = "nodejs";

/**
 * The signed-in user, for the app's home and profile screens, plus what the
 * app needs to route a new account: phone verification (investors) and
 * approval / details (stewards).
 */
export async function GET() {
  const user = await requireMobileUser();
  if (user instanceof Response) return user;

  const db = createAdminClient();
  const steward = user.role === "steward";
  const [{ data: row }, { data: profile }, { data: rejection }, unread] = await Promise.all([
    db.from("users").select("phone_verified_at, steward_approval_status").eq("id", user.id).maybeSingle(),
    steward
      ? db.from("steward_profiles").select("user_id").eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    // The reason is only kept on the notification the steward received.
    steward
      ? db
          .from("notifications")
          .select("params")
          .eq("user_id", user.id)
          .eq("kind", "steward_rejected")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    getUnreadCount(user.id),
  ]);

  return json({
    id: user.id,
    role: user.role,
    fullName: user.fullName,
    phone: user.phone,
    email: user.email,
    status: user.status,
    phoneVerified: Boolean(row?.phone_verified_at),
    kycStatus: user.kycStatus,
    kycRejectionReason: user.kycRejectionReason,
    stewardApprovalStatus: steward ? row?.steward_approval_status ?? null : null,
    stewardRejectionReason:
      steward && row?.steward_approval_status === "rejected"
        ? ((rejection?.params as { reason?: string } | null)?.reason ?? null)
        : null,
    stewardDetailsDone: steward ? Boolean(profile) : null,
    unreadNotifications: unread,
  });
}
