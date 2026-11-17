"use client";

import { useTranslations } from "next-intl";
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
    <div className="flex w-full max-w-[960px] flex-col gap-6">
      <h1 className="font-serif text-[28px] leading-tight text-ink lg:text-[32px]">
        {t("title")}
      </h1>

      <section className="flex flex-col gap-6 rounded-2xl border border-border-light bg-white p-8">
        <div className="flex flex-col gap-1">
          <h2 className="font-serif text-[20px] leading-tight text-ink">
            {t("profileTitle")}
          </h2>
          <p className="text-[13px] text-ink-muted">
            {t("profileHint")}
          </p>
        </div>
        <ProfileEditForm
          initialFullName={fullName}
          initialEmail={email}
          phone={phone}
        />
      </section>

      <section className="flex flex-col gap-6 rounded-2xl border border-border-light bg-white p-8">
        <div className="flex flex-col gap-1">
          <h2 className="font-serif text-[20px] leading-tight text-ink">
            {t("passwordTitle")}
          </h2>
          <p className="text-[13px] text-ink-muted">
            {t("passwordHint")}
          </p>
        </div>
        <ChangePasswordForm />
      </section>
    </div>
  );
}