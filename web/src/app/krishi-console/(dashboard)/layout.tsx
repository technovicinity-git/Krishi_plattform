import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/current-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { getUnreadCount } from "@/lib/notifications/read";

export const metadata: Metadata = {
  title: "Krishi Console",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  const db = createAdminClient();

  const [{ count: kyc }, { count: deposits }, { count: stewards }, { count: sales }, { count: withdrawals }, unread, { count: orphanPayments }] = await Promise.all([
    db.from("kyc_profiles").select("*", { count: "exact", head: true }).eq("status", "pending"),
    db.from("deposits").select("*", { count: "exact", head: true }).eq("status", "pending"),
    db
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "steward")
      .eq("steward_approval_status", "pending"),
    db
      .from("investment_sales")
      .select("*", { count: "exact", head: true })
      .eq("status", "remittance_submitted"),
    db
      .from("withdrawal_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    getUnreadCount(admin.id),
    // Paid online but no deposit was recorded: only visible under Deposits → Online payments.
    db.from("online_payments").select("*", { count: "exact", head: true }).eq("status", "paid").is("deposit_id", null),
  ]);

  return (
    <DashboardShell
      roleLabel="Admin"
      title="Krishi Console"
      subtitle="Internal operations"
      user={{ fullName: admin.fullName ?? "Admin", phone: admin.email }}
      menuItems={[
        { label: "View public site", href: "/" },
        { label: "KYC Queue", href: "/krishi-console/kyc" },
        { label: "Audit Log", href: "/krishi-console/audit" },
      ]}
      headerActions={
        <NotificationBell initialUnread={unread} allHref="/krishi-console/notifications" localized={false} />
      }
      logoutEndpoint="/api/admin/auth/logout"
      logoutRedirect="/krishi-console/login"
      labels={{
        signOut: "Sign out",
        signingOut: "Signing out...",
        home: "Krishi Console",
        brand: "Krishi",
      }}
      sections={[
        {
          label: "Overview",
          items: [{ label: "Dashboard", href: "/krishi-console", icon: "home", exact: true }],
        },
        {
          label: "Review",
          items: [
            { label: "KYC Queue", href: "/krishi-console/kyc", icon: "shield", badge: kyc ?? 0 },
            { label: "Deposits", href: "/krishi-console/deposits", icon: "coins", badge: (deposits ?? 0) + (orphanPayments ?? 0) },
            { label: "Sales", href: "/krishi-console/sales", icon: "tag", badge: sales ?? 0 },
            { label: "Withdrawals", href: "/krishi-console/withdrawals", icon: "wallet", badge: withdrawals ?? 0 },
            { label: "Transactions", href: "/krishi-console/transactions", icon: "coins" },
          ],
        },
        {
          label: "People",
          items: [
            { label: "Investors", href: "/krishi-console/investors", icon: "briefcase" },
            { label: "Stewards", href: "/krishi-console/stewards", icon: "users", badge: stewards ?? 0 },
            { label: "Farmers", href: "/krishi-console/farmers", icon: "leaf" },
            { label: "Reviews", href: "/krishi-console/reviews", icon: "inbox" },
          ],
        },
        {
          label: "Catalogue",
          items: [
            { label: "Plans", href: "/krishi-console/plans", icon: "clipboard" },
            { label: "Categories", href: "/krishi-console/categories", icon: "tag" },
            { label: "Locations", href: "/krishi-console/locations", icon: "map" },
          ],
        },
        {
          label: "System",
          items: [
            { label: "Notifications", href: "/krishi-console/notifications", icon: "bell", badge: unread },
            { label: "Audit Log", href: "/krishi-console/audit", icon: "history" },
          ],
        },
      ]}
    >
      {children}
    </DashboardShell>
  );
}
