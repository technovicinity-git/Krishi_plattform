import { requireAdmin } from "@/lib/admin/current-admin";
import { getNotifications } from "@/lib/notifications/read";
import { ButtonLink, PageHeader } from "@/components/dashboard/ui";
import { NotificationList } from "@/components/notifications/NotificationList";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const admin = await requireAdmin();
  const { items } = await getNotifications(admin.id, 100);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notifications"
        description="New KYC submissions, deposits, sale payments, total losses, steward applications and withdrawal requests."
        actions={
          <ButtonLink href="/krishi-console/notifications/send" localized={false}>
            Send a notification
          </ButtonLink>
        }
      />
      <NotificationList initial={items} localized={false} />
    </div>
  );
}
