import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { PortalSidebar } from "@/components/portal/PortalSidebar";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const t = await getTranslations("app.userMenu");

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <PortalHeader
        fullName={user.fullName ?? t("user")}
        phone={user.phone}
        menuItems={[
          { label: t("profile"), href: "/portal/profile" },
          { label: t("kyc"), href: "/portal/kyc" },
          { label: t("settings"), href: "/portal/settings" },
        ]}
      />
      <div className="flex flex-1 flex-col lg:flex-row">
        <PortalSidebar />
        <main className="flex-1 px-6 py-8 sm:px-10 lg:px-12 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}