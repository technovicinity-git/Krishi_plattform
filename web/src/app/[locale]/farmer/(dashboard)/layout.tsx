import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { getUnreadCount } from "@/lib/notifications/read";

export default async function FarmerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "farmer") redirect("/login");

  const locale = await getLocale();
  const db = createAdminClient();
  const [tu, tr, tn, tp, { count: pendingFunds }] = await Promise.all([
    getTranslations("app.userMenu"),
    getTranslations("app.roles"),
    getTranslations("app.farmerNav"),
    getTranslations("app.panel"),
    db
      .from("fund_requests")
      .select("*", { count: "exact", head: true })
      .eq("farmer_id", user.id)
      .eq("status", "pending"),
  ]);

  const unreadNotifications = await getUnreadCount(user.id);

  return (
    <DashboardShell
      headerActions={<NotificationBell initialUnread={unreadNotifications} allHref="/farmer/notifications" />}
      locale={locale}
      roleLabel={tr("farmer")}
      title={tp("farmerTitle")}
      subtitle={tp("farmerSubtitle")}
      lockedLabel={tp("soon")}
      user={{ fullName: user.fullName ?? tr("farmer"), phone: user.phone }}
      menuItems={[
        { label: tn("profile"), href: "/farmer/profile" },
        { label: tn("settings"), href: "/farmer/settings" },
      ]}
      logoutRedirect={locale === "bn" ? "/login" : "/en/login"}
      labels={{
        signOut: tu("signOut"),
        signingOut: tu("signingOut"),
        home: tu("home"),
        brand: tu("brand"),
      }}
      sections={[
        {
          label: tp("workspace"),
          items: [
            { label: tn("dashboard"), href: "/farmer", icon: "home", exact: true },
            { label: tn("fundRequests"), href: "/farmer/fund-requests", icon: "coins", badge: pendingFunds ?? 0 },
            { label: tn("expenses"), href: "/farmer/expenses", icon: "receipt" },
            { label: tp("wallet"), href: "/farmer/wallet", icon: "wallet" },
          ],
        },
        {
          label: tp("account"),
          items: [
            { label: tn("profile"), href: "/farmer/profile", icon: "user" },
            { label: tn("settings"), href: "/farmer/settings", icon: "settings" },
          ],
        },
        {
          label: tp("comingSoon"),
          locked: true,
          items: [
            { label: tn("livestock"), href: "/farmer/livestock", icon: "leaf" },
            { label: tn("sales"), href: "/farmer/sales", icon: "tag" },
          ],
        },
      ]}
    >
      {children}
    </DashboardShell>
  );
}
