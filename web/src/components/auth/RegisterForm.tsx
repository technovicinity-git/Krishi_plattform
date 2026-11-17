"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { registerSchema } from "@/lib/auth/schemas";
import { toE164 } from "@/lib/auth/phone";
import { FormInput } from "./FormInput";
import { FormPasswordInput } from "./FormPasswordInput";
import { FormCheckbox } from "./FormCheckbox";
import { useDialog } from "@/components/ui/dialog-provider";

export function RegisterForm() {
  const t = useTranslations("auth.register");
  const tErr = useTranslations("errors");
  const router = useRouter();
  const { alert } = useDialog();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = registerSchema.safeParse({
      fullName,
      phone,
      email,
      password,
      confirmPassword,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? tErr("generic"));
      return;
    }
    if (!agreed) {
      await alert({
        title: t("agreementRequired"),
        variant: "danger",
      });
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phone, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? tErr("generic"));
        setSubmitting(false);
        return;
      }

      const e164 = toE164(phone);
      router.push(`/verify-otp?phone=${encodeURIComponent(e164)}`);
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
          label={t("fullNameLabel")}
          name="fullName"
          placeholder={t("fullNamePlaceholder")}
          value={fullName}
          onChange={setFullName}
          required
          autoComplete="name"
        />
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
        <FormInput
          label={t("emailLabel")}
          name="email"
          type="email"
          placeholder={t("emailPlaceholder")}
          value={email}
          onChange={setEmail}
          optional
          autoComplete="email"
        />
        <FormPasswordInput
          label={t("passwordLabel")}
          name="password"
          value={password}
          onChange={setPassword}
          required
          autoComplete="new-password"
          helper={t("passwordHelper")}
        />
        <FormPasswordInput
          label={t("confirmPasswordLabel")}
          name="confirmPassword"
          value={confirmPassword}
          onChange={setConfirmPassword}
          required
          autoComplete="new-password"
        />
        <FormCheckbox id="terms" checked={agreed} onChange={setAgreed}>
          {t("agreePrefix")}{" "}
          <Link href="/terms" className="font-semibold text-brand underline">
            {t("termsLink")}
          </Link>{" "}
          {t("and")}{" "}
          <Link href="/privacy" className="font-semibold text-brand underline">
            {t("privacyLink")}
          </Link>
          .
        </FormCheckbox>
      </div>

      {error && (
        <div className="rounded-[8px] border border-[#F0C9C0] bg-[#FAF0ED] px-4 py-3 text-[13px] text-[#A13D2B]">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[8px] bg-brand text-[15px] font-bold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
      >
        {submitting ? t("submitting") : t("submit")}
        {!submitting && <span aria-hidden="true">→</span>}
      </button>

      <div className="border-t border-border-light pt-6 text-center">
        <p className="text-[13px] text-ink-secondary">
          {t("haveAccount")}{" "}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            {t("loginLink")}
          </Link>
        </p>
      </div>
    </form>
  );
}