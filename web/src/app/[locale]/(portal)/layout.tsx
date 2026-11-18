import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { getUnreadCount } from "@/lib/notifications/read";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const locale = await getLocale();
  const [tu, tr, ts, tp] = await Promise.all([
    getTranslations("app.userMenu"),
    getTranslations("app.roles"),
    getTranslations("portal.sidebar"),
    getTranslations("app.panel"),
  ]);

  const unreadNotifications = await getUnreadCount(user.id);

  return (
    <DashboardShell
      headerActions={<NotificationBell initialUnread={unreadNotifications} allHref="/portal/notifications" />}
      locale={locale}
      roleLabel={tr("investor")}
      title={tp("investorTitle")}
      subtitle={tp("investorSubtitle")}
      lockedLabel={tp("soon")}
      user={{ fullName: user.fullName ?? tu("user"), phone: user.phone }}
      menuItems={[
        { label: tu("profile"), href: "/portal/profile" },
        { label: tu("kyc"), href: "/portal/kyc" },
        { label: tu("settings"), href: "/portal/settings" },
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
            { label: ts("items.investments"), href: "/portal/investments", icon: "briefcase" },
            { label: ts("items.interests"), href: "/portal/interests", icon: "inbox" },
            { label: tp("wallet"), href: "/portal/wallet", icon: "wallet" },
            { label: ts("items.livestock"), href: "/portal/livestock", icon: "leaf" },
            { label: ts("items.reports"), href: "/portal/reports", icon: "chart" },
          ],
        },
        {
          label: tp("account"),
          items: [
            { label: ts("items.profile"), href: "/portal/profile", icon: "user" },
            { label: ts("items.kyc"), href: "/portal/kyc", icon: "shield" },
            { label: ts("items.accountSettings"), href: "/portal/settings", icon: "settings" },
          ],
        },
      ]}
    >
      {children}
    </DashboardShell>
  );
}
