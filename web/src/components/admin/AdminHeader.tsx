"use client";

import { UserMenu } from "@/components/layout/UserMenu";

export function AdminHeader({ adminName }: { adminName: string }) {
  return (
    <header className="flex h-[64px] items-center justify-between border-b border-border-light bg-white px-4 sm:px-8">
      <span className="text-[13px] font-medium text-ink-secondary">
        Admin Console
      </span>
      <UserMenu
        fullName={adminName}
        items={[
          { label: "View public site", href: "/" },
          { label: "KYC Queue", href: "/krishi-console/kyc" },
          { label: "Audit Log", href: "/krishi-console/audit" },
        ]}
        logoutRedirect="/krishi-console/login"
        logoutEndpoint="/api/admin/auth/logout"
      />
    </header>
  );
}