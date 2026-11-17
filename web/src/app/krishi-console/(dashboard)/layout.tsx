import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/current-admin";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";

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

  return (
    <div className="flex min-h-screen bg-stone">
      <AdminSidebar />
      <div className="flex flex-1 flex-col">
        <AdminHeader adminName={admin.fullName ?? "Admin"} />
        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}