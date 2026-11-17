import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { FarmerSidebar } from "@/components/farmer/FarmerSidebar";

export default async function FarmerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "farmer") {
    redirect("/login");
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col bg-cream lg:flex-row">
      <FarmerSidebar />
      <main className="flex-1 px-6 py-8 sm:px-10 lg:px-12">
        {children}
      </main>
    </div>
  );
}