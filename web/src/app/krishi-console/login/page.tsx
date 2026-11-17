import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin/current-admin";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const metadata: Metadata = {
  title: "Krishi Console — Sign In",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  // Already logged in as admin? Send straight to dashboard.
  const admin = await getCurrentAdmin();
  if (admin) redirect("/krishi-console");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone px-6 py-12">
      <div className="w-full max-w-[440px] rounded-2xl border border-border-light bg-white p-10">
        <div className="mb-8 flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.02em] text-terracotta">
            Internal Access
          </span>
          <h1 className="font-serif text-[28px] leading-tight text-ink">
            Krishi Console
          </h1>
          <p className="text-[13px] text-ink-secondary">
            Administrator sign-in only.
          </p>
        </div>

        <AdminLoginForm />
      </div>

      <p className="mt-6 text-center text-[11px] text-ink-muted">
        Unauthorized access is logged and monitored.
      </p>
    </div>
  );
}