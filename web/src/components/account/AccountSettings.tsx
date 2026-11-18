"use client";

import { useTranslations } from "next-intl";
import { PageHeader, Panel } from "@/components/dashboard/ui";
import { ProfileEditForm } from "./ProfileEditForm";
import { ChangePasswordForm } from "./ChangePasswordForm";

interface AccountSettingsProps {
  fullName: string;
  email: string;
  phone: string;
}

export function AccountSettings({
  fullName,
  email,
  phone,
}: AccountSettingsProps) {
  const t = useTranslations("app.accountSettings");
  return (
    <div className="flex w-full max-w-[880px] flex-col gap-6">
      <PageHeader title={t("title")} />

      <Panel title={t("profileTitle")} description={t("profileHint")} bodyClassName="p-6 sm:p-8">
        <ProfileEditForm
          initialFullName={fullName}
          initialEmail={email}
          phone={phone}
        />
      </Panel>

      <Panel title={t("passwordTitle")} description={t("passwordHint")} bodyClassName="p-6 sm:p-8">
        <ChangePasswordForm />
      </Panel>
    </div>
  );
}
