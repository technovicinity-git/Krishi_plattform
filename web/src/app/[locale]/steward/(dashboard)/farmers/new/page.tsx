import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { CreateFarmerForm } from "@/components/steward/CreateFarmerForm";
import { BackLink } from "@/components/ui/BackLink";

export default async function NewFarmerPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const t = await getTranslations("app.stewardFarmer");

  return (
    <div className="flex w-full max-w-[640px] flex-col gap-6">
      <div className="flex flex-col gap-3">
        <BackLink href="/steward/farmers">{t("back")}</BackLink>
        <h1 className="font-serif text-[28px] leading-tight text-ink">
          {t("addTitle")}
        </h1>
      </div>

      <CreateFarmerForm />
    </div>
  );
}