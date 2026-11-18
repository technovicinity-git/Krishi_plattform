"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useDialog } from "@/components/ui/dialog-provider";

interface ProfileEditFormProps {
  initialFullName: string;
  initialEmail: string;
  phone: string;
}

export function ProfileEditForm({
  initialFullName,
  initialEmail,
  phone,
}: ProfileEditFormProps) {
  const t = useTranslations("app.profileForm");
  const tc = useTranslations("app.common");
  const router = useRouter();
  const { alert } = useDialog();
  const [fullName, setFullName] = useState(initialFullName);
  const [email, setEmail] = useState(initialEmail);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? t("failed"));
        setSubmitting(false);
        return;
      }

      await alert({
        title: t("updated"),
        variant: "success",
      });
      router.refresh();
      setSubmitting(false);
    } catch {
      setError(tc("networkError"));
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold text-ink-nav">{t("fullName")}</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="h-[42px] w-full rounded-[8px] border border-border-light bg-cream px-3 text-[13px] text-ink focus:border-sage focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold text-ink-nav">{t("phone")}</label>
          <input
            type="text"
            value={phone}
            disabled
            className="h-[42px] w-full rounded-[8px] border border-border-light bg-stone px-3 text-[13px] text-ink-muted"
          />
          <p className="text-[11px] text-ink-muted">
            {t("phoneLocked")}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label className="text-[13px] font-semibold text-ink-nav">
            {t("email")} <span className="text-[11px] font-normal text-ink-muted">{tc("optional")}</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("emailPlaceholder")}
            className="h-[42px] w-full rounded-[8px] border border-border-light bg-cream px-3 text-[13px] text-ink placeholder:text-ink-muted focus:border-sage focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-[8px] border border-[#F0C9C0] bg-[#FAF0ED] px-4 py-3 text-[13px] text-[#A13D2B]">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-[42px] items-center justify-center rounded-[8px] bg-brand px-6 text-[13px] font-bold text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {submitting ? tc("saving") : t("save")}
        </button>
      </div>
    </form>
  );
}