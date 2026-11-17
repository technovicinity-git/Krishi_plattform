"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useDialog } from "@/components/ui/dialog-provider";
import { FormPasswordInput } from "@/components/auth/FormPasswordInput";

export function ChangePasswordForm() {
  const t = useTranslations("app.passwordForm");
  const tc = useTranslations("app.common");
  const { alert } = useDialog();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError(t("mismatch"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? t("failed"));
        setSubmitting(false);
        return;
      }

      await alert({
        title: t("changed"),
        variant: "success",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSubmitting(false);
    } catch {
      setError(tc("networkError"));
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <FormPasswordInput
        label={t("current")}
        name="currentPassword"
        value={currentPassword}
        onChange={setCurrentPassword}
        required
        autoComplete="current-password"
      />
      <FormPasswordInput
        label={t("new")}
        name="newPassword"
        value={newPassword}
        onChange={setNewPassword}
        required
        autoComplete="new-password"
        helper={t("helper")}
      />
      <FormPasswordInput
        label={t("confirm")}
        name="confirmPassword"
        value={confirmPassword}
        onChange={setConfirmPassword}
        required
        autoComplete="new-password"
      />

      {error && (
        <div className="rounded-[8px] border border-[#F0C9C0] bg-[#FAF0ED] px-4 py-3 text-[13px] text-[#A13D2B]">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-[42px] items-center justify-center rounded-[8px] bg-ink px-6 text-[13px] font-bold text-white hover:bg-[#2A2A2A] disabled:opacity-60"
        >
          {submitting ? t("updating") : t("submit")}
        </button>
      </div>
    </form>
  );
}