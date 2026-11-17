"use client";

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
  return (
    <div className="flex w-full max-w-[960px] flex-col gap-6">
      <h1 className="font-serif text-[28px] leading-tight text-ink lg:text-[32px]">
        Account Settings
      </h1>

      <section className="flex flex-col gap-6 rounded-2xl border border-border-light bg-white p-8">
        <div className="flex flex-col gap-1">
          <h2 className="font-serif text-[20px] leading-tight text-ink">
            Profile
          </h2>
          <p className="text-[13px] text-ink-muted">
            Update your name and email. Phone number cannot be changed.
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
            Change Password
          </h2>
          <p className="text-[13px] text-ink-muted">
            Choose a strong password you don't use anywhere else.
          </p>
        </div>
        <ChangePasswordForm />
      </section>
    </div>
  );
}