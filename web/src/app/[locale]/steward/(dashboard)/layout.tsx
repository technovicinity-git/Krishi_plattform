import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { StewardSidebar } from "@/components/steward/StewardSidebar";

export default async function StewardDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "steward") redirect("/portal/profile");
  const t = await getTranslations("app.userMenu");
  const tr = await getTranslations("app.roles");

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <PortalHeader
        fullName={user.fullName ?? tr("steward")}
        phone={user.phone}
        menuItems={[
          { label: t("dashboard"), href: "/steward" },
          { label: t("profile"), href: "/steward/profile" },
          { label: t("settings"), href: "/steward/settings" },
        ]}
      />
      <div className="flex flex-1 flex-col lg:flex-row">
        <StewardSidebar />
        <main className="flex-1 px-6 py-8 sm:px-10 lg:px-12 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}