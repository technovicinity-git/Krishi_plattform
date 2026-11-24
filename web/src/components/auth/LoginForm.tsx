"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import NextLink from "next/link";
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
            className="text-[13px] font-semibold text-brand hover:underline"
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
        className="inline-flex h-[52px] w-full items-center justify-center rounded-[8px] bg-brand text-[15px] font-bold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
      >
        {submitting ? t("submitting") : t("submit")}
      </button>

      <div className="flex flex-col items-center gap-3 border-t border-border-light pt-6">
        <p className="text-[13px] text-ink-secondary">
          {t("noAccount")}{" "}
          <Link href="/register" className="font-semibold text-brand hover:underline">
            {t("createAccount")}
          </Link>
        </p>
        {/* Farmers are added by their steward and activate with a code. */}
        <Link
          href="/farmer/activate"
          className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-[8px] border border-border-light bg-white px-3 py-2 text-center text-[13.5px] font-semibold leading-snug text-ink-secondary transition-colors hover:border-brand/40 hover:bg-brand-tint hover:text-green-deep"
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
            <path d="M5 15c0-6 4-10 11-10 0 7-4 11-10 11-.4 0-.7 0-1-.1" />
            <path d="M4 16c3-3 5-5 8-7" />
          </svg>
          {t("farmerActivate")}
        </Link>
        {/* The admin console has no language prefix, so this is a plain link. */}
        <NextLink
          href="/krishi-console/login"
          className="group inline-flex items-center gap-1 rounded-full px-2 py-1 text-[12px] font-medium text-ink-muted transition-colors hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          {t("adminLink")}
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="h-3 w-3 transition-transform duration-150 group-hover:translate-x-0.5"
          >
            <path d="M6 3.5L10.5 8 6 12.5" />
          </svg>
        </NextLink>
      </div>
    </form>
  );
}