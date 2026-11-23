import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { getUnreadCount } from "@/lib/notifications/read";

/** Counts shown as badges in the sidebar: work waiting for this steward. */
async function getPendingCounts(stewardId: string) {
  const db = createAdminClient();
  const { data: offerings } = await db
    .from("steward_plan_offerings")
    .select("id")
    .eq("steward_id", stewardId);
  const offeringIds = (offerings ?? []).map((o) => o.id);
  if (offeringIds.length === 0) return { interests: 0, funds: 0, awaitingFarmer: 0, expenses: 0, sales: 0 };

  const [{ count: interests }, { data: investments }] = await Promise.all([
    db
      .from("investment_interests")
      .select("*", { count: "exact", head: true })
      .in("offering_id", offeringIds)
      .in("status", ["submitted", "under_review"]),
    db.from("investments").select("id, current_stage").in("offering_id", offeringIds),
  ]);

  const investmentIds = (investments ?? []).map((i) => i.id);
  const none = { count: 0 };
  const [{ count: funds }, { count: expenses }, { count: sales }] = investmentIds.length
    ? await Promise.all([
        db
          .from("fund_requests")
          .select("*", { count: "exact", head: true })
          .in("investment_id", investmentIds)
          .eq("status", "pending"),
        db
          .from("expenses")
          .select("*", { count: "exact", head: true })
          .in("investment_id", investmentIds)
          .eq("status", "pending"),
        db
          .from("investment_sales")
          .select("*", { count: "exact", head: true })
          .in("investment_id", investmentIds)
          .eq("status", "pending_review"),
      ])
    : [none, none, none];

  return {
    interests: interests ?? 0,
    funds: funds ?? 0,
    expenses: expenses ?? 0,
    sales: sales ?? 0,
    awaitingFarmer: (investments ?? []).filter((i) => i.current_stage === "awaiting_farmer").length,
  };
}

export default async function StewardDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "steward") redirect("/portal/profile");

  const locale = await getLocale();
  const [tu, tr, ts, tp, counts] = await Promise.all([
    getTranslations("app.userMenu"),
    getTranslations("app.roles"),
    getTranslations("stewardPortal.sidebar"),
    getTranslations("app.panel"),
    getPendingCounts(user.id),
  ]);

  const unreadNotifications = await getUnreadCount(user.id);

  return (
    <DashboardShell
      headerActions={<NotificationBell initialUnread={unreadNotifications} allHref="/steward/notifications" />}
      locale={locale}
      roleLabel={tr("steward")}
      title={tp("stewardTitle")}
      subtitle={tp("stewardSubtitle")}
      lockedLabel={tp("soon")}
      user={{ fullName: user.fullName ?? tr("steward"), phone: user.phone }}
      menuItems={[
        { label: tu("profile"), href: "/steward/profile" },
        { label: tu("settings"), href: "/steward/settings" },
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
            { label: ts("items.dashboard"), href: "/steward", icon: "home", exact: true },
            { label: ts("items.plans"), href: "/steward/plans", icon: "clipboard" },
            { label: ts("items.farmers"), href: "/steward/farmers", icon: "users" },
            { label: ts("items.interests"), href: "/steward/interests", icon: "inbox", badge: counts.interests },
            { label: ts("items.investments"), href: "/steward/investments", icon: "briefcase", badge: counts.awaitingFarmer },
            { label: ts("items.fundRequests"), href: "/steward/fund-requests", icon: "coins", badge: counts.funds },
            { label: ts("items.expenses"), href: "/steward/expenses", icon: "receipt", badge: counts.expenses },
            { label: ts("items.sales"), href: "/steward/sales", icon: "tag", badge: counts.sales },
            { label: tp("wallet"), href: "/steward/wallet", icon: "wallet" },
            { label: tp("transactions"), href: "/steward/transactions", icon: "coins" },
            { label: ts("items.livestock"), href: "/steward/livestock", icon: "leaf" },
            { label: ts("items.reports"), href: "/steward/reports", icon: "chart" },
          ],
        },
        {
          label: tp("account"),
          items: [
            { label: ts("items.profile"), href: "/steward/profile", icon: "user" },
            { label: ts("items.kyc"), href: "/onboarding/kyc", icon: "shield" },
            { label: tu("settings"), href: "/steward/settings", icon: "settings" },
          ],
        },
      ]}
    >
      {children}
    </DashboardShell>
  );
}
