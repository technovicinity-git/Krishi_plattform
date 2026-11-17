"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { phoneSchema } from "@/lib/auth/schemas";
import { toE164 } from "@/lib/auth/phone";
import { FormInput } from "./FormInput";

export function ForgotPasswordForm() {
  const t = useTranslations("auth.forgot");
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t("errors.generic"));
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Unable to send code");
        setSubmitting(false);
        return;
      }

      const e164 = toE164(phone);
      router.push(`/reset-password?phone=${encodeURIComponent(e164)}`);
    } catch {
      setError(t("errors.network"));
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.02em] text-sage">
          {t("eyebrow")}
        </span>
        <h1 className="font-serif text-[36px] leading-[1.1] text-ink lg:text-[42px]">
          {t("heading")}
        </h1>
        <p className="text-[15px] leading-[1.6] text-ink-secondary">
          {t("subheading")}
        </p>
      </div>

      <FormInput
        label={t("phoneLabel")}
        name="phone"
        type="tel"
        placeholder={t("phonePlaceholder")}
        value={phone}
        onChange={setPhone}
        prefix="+880"
        required
        autoComplete="tel"
        helper={t("phoneHelper")}
      />

      {error && (
        <div className="rounded-[8px] border border-[#F0C9C0] bg-[#FAF0ED] px-4 py-3 text-[13px] text-[#A13D2B]">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[8px] bg-terracotta text-[15px] font-bold text-white transition-colors hover:bg-[#B3634A] disabled:opacity-60"
      >
        {submitting ? t("submitting") : t("submit")}
        {!submitting && <span aria-hidden="true">→</span>}
      </button>

      <div className="flex flex-col gap-2 rounded-[8px] border border-border-light bg-stone p-5">
        <span className="text-[14px] font-bold text-ink">{t("infoTitle")}</span>
        <p className="text-[13px] leading-[1.55] text-ink-secondary">
          {t("infoBody")}
        </p>
      </div>

      <div className="flex justify-center border-t border-border-light pt-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-nav hover:text-ink"
        >
          <span aria-hidden="true">←</span>
          {t("backToLogin")}
        </Link>
      </div>
    </form>
  );
}