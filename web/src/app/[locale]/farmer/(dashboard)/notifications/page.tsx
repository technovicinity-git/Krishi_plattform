import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getNotifications } from "@/lib/notifications/read";
import { PageHeader } from "@/components/dashboard/ui";
import { NotificationList } from "@/components/notifications/NotificationList";

export const dynamic = "force-dynamic";

export default async function FarmerNotificationsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "farmer") redirect("/login");

  const [{ items }, t] = await Promise.all([
    getNotifications(user.id, 100),
    getTranslations("app.notifications"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("heading")} description={t("subtitle")} />
      <NotificationList initial={items} />
    </div>
  );
}
