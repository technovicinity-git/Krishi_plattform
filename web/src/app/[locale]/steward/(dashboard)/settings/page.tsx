import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { AccountSettings } from "@/components/account/AccountSettings";

export default async function StewardSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "steward") redirect("/portal/settings");

  return (
    <AccountSettings
      fullName={user.fullName ?? ""}
      email={user.email ?? ""}
      phone={user.phone ?? ""}
    />
  );
}