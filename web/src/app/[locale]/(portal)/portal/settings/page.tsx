import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { AccountSettings } from "@/components/account/AccountSettings";

export default async function PortalSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AccountSettings
      fullName={user.fullName ?? ""}
      email={user.email ?? ""}
      phone={user.phone ?? ""}
    />
  );
}