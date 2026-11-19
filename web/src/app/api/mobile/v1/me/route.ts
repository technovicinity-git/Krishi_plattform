import { requireMobileUser, json } from "@/lib/mobile/api";
import { getUnreadCount } from "@/lib/notifications/read";

export const runtime = "nodejs";

/** The signed-in user, for the app's home and profile screens. */
export async function GET() {
  const user = await requireMobileUser();
  if (user instanceof Response) return user;
  return json({
    id: user.id,
    role: user.role,
    fullName: user.fullName,
    phone: user.phone,
    email: user.email,
    kycStatus: user.kycStatus,
    kycRejectionReason: user.kycRejectionReason,
    unreadNotifications: await getUnreadCount(user.id),
  });
}
