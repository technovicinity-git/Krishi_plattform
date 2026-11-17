"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { FormInput } from "./FormInput";
import { FormPasswordInput } from "./FormPasswordInput";

export function AdminLoginForm() {
  const t = useTranslations("adminLogin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    console.log("[stub] admin login", { email });
    setTimeout(() => setSubmitting(false), 800);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.02em] text-terracotta">
          {t("eyebrow")}
        </span>
        <h1 className="font-serif text-[36px] leading-[1.1] text-ink lg:text-[42px]">
          {t("heading")}
        </h1>
        <p className="text-[15px] leading-[1.6] text-ink-secondary">
          {t("subheading")}
        </p>
      </div>

      <div className="flex flex-col gap-5">
        <FormInput
          label={t("emailLabel")}
          name="email"
          type="email"
          placeholder={t("emailPlaceholder")}
          value={email}
          onChange={setEmail}
          required
          autoComplete="email"
        />
        <FormPasswordInput
          label={t("passwordLabel")}
          name="password"
          value={password}
          onChange={setPassword}
          required
          autoComplete="current-password"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-[52px] w-full items-center justify-center rounded-[8px] bg-ink text-[15px] font-bold text-white transition-colors hover:bg-[#2A2A2A] disabled:opacity-60"
      >
        {submitting ? t("submitting") : t("submit")}
      </button>

      <div className="border-t border-border-light pt-6 text-center">
        <Link
          href="/login"
          className="text-[13px] font-semibold text-terracotta hover:underline"
        >
          {t("backToUserLogin")}
        </Link>
      </div>

      <p className="text-center text-[11px] leading-tight text-ink-muted">
        {t("securityNote")}
      </p>
    </form>
  );
}