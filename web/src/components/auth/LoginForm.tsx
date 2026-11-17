"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { loginSchema } from "@/lib/auth/schemas";
import { FormInput } from "./FormInput";
import { FormPasswordInput } from "./FormPasswordInput";

export function LoginForm() {
  const t = useTranslations("auth.login");
  const tErr = useTranslations("errors");
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse({ phone, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? tErr("generic"));
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? tErr("invalidCredentials"));
        setSubmitting(false);
        return;
      }

      // Route based on role
      const target =
        data.role === "admin"
          ? "/krishi-console"
          : data.role === "steward"
            ? "/steward"
            : data.role === "farmer"
              ? "/farmer"
              : "/portal/profile";
      router.push(target);
      router.refresh();
    } catch {
      setError(tErr("network"));
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

      <div className="flex flex-col gap-5">
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
        <FormPasswordInput
          label={t("passwordLabel")}
          name="password"
          value={password}
          onChange={setPassword}
          required
          autoComplete="current-password"
        />
        <div className="-mt-2 flex justify-end">
          <Link
            href="/forgot-password"
            className="text-[13px] font-semibold text-terracotta hover:underline"
          >
            {t("forgotPassword")}
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-[8px] border border-[#F0C9C0] bg-[#FAF0ED] px-4 py-3 text-[13px] text-[#A13D2B]">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-[52px] w-full items-center justify-center rounded-[8px] bg-terracotta text-[15px] font-bold text-white transition-colors hover:bg-[#B3634A] disabled:opacity-60"
      >
        {submitting ? t("submitting") : t("submit")}
      </button>

      <div className="flex flex-col items-center gap-3 border-t border-border-light pt-6">
        <p className="text-[13px] text-ink-secondary">
          {t("noAccount")}{" "}
          <Link href="/register" className="font-semibold text-terracotta hover:underline">
            {t("createAccount")}
          </Link>
        </p>
        <Link
          href="/krishi-console/login"
          className="text-[12px] text-ink-muted hover:text-ink"
        >
          {t("adminLink")}
        </Link>
      </div>
    </form>
  );
}