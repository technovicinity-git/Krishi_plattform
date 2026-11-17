import { redirect } from "next/navigation";
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

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <PortalHeader
        fullName={user.fullName ?? "Steward"}
        phone={user.phone}
        menuItems={[
          { label: "Dashboard", href: "/steward" },
          { label: "Profile", href: "/steward/profile" },
          { label: "Account Settings", href: "/steward/settings" },
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