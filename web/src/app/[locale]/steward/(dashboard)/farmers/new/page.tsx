import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { CreateFarmerForm } from "@/components/steward/CreateFarmerForm";
import { BackLink } from "@/components/ui/BackLink";
import { PageHeader } from "@/components/dashboard/ui";

export default async function NewFarmerPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const t = await getTranslations("app.stewardFarmer");

  return (
    <div className="flex w-full max-w-[720px] flex-col gap-6">
      <PageHeader back={<BackLink href="/steward/farmers">{t("back")}</BackLink>} title={t("addTitle")} />

      <CreateFarmerForm />
    </div>
  );
}