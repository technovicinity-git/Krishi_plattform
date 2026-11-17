"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useDialog } from "@/components/ui/dialog-provider";
import { FormInput } from "./FormInput";
import { FormPasswordInput } from "./FormPasswordInput";
import { FormCheckbox } from "./FormCheckbox";

function Stepper({ step }: { step: 1 | 2 }) {
  const t = useTranslations("stewardRegister.stepper");
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-bold uppercase tracking-[0.02em] ${
              step === 1 ? "text-terracotta" : "text-ink-muted"
            }`}
          >
            {t("step1")}
          </span>
          <span className="text-[11px] text-ink-muted">
            {step === 1 ? t("current") : t("completed")}
          </span>
        </div>
        <div className={`h-0.5 w-full rounded ${step === 1 ? "bg-terracotta" : "bg-stone"}`} />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-bold uppercase tracking-[0.02em] ${
              step === 2 ? "text-terracotta" : "text-ink-muted"
            }`}
          >
            {t("step2")}
          </span>
          <span className="text-[11px] text-ink-muted">
            {step === 2 ? t("current") : t("next")}
          </span>
        </div>
        <div className={`h-0.5 w-full rounded ${step === 2 ? "bg-terracotta" : "bg-stone"}`} />
      </div>
    </div>
  );
}

export function StewardRegisterForm() {
  const t = useTranslations("stewardRegister.step1");
  const tf = useTranslations("app.forms");
  const tcm = useTranslations("app.common");
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

    if (password !== confirmPassword) {
      await alert({ title: t("passwordMismatch"), variant: "danger" });
      return;
    }
    if (!agreed) {
      await alert({ title: t("agreementRequired"), variant: "danger" });
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/steward-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phone, email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? tf("failedCreate"));
        setSubmitting(false);
        return;
      }

      router.push("/steward/register/details");
      router.refresh();
    } catch {
      setError(tcm("networkError"));
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <Stepper step={1} />

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
          <Link href="/terms" className="font-semibold text-terracotta underline">
            {t("termsLink")}
          </Link>{" "}
          {t("and")}{" "}
          <Link href="/privacy" className="font-semibold text-terracotta underline">
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
        className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[8px] bg-terracotta text-[15px] font-bold text-white transition-colors hover:bg-[#B3634A] disabled:opacity-60"
      >
        {submitting ? t("submitting") : t("submit")}
        {!submitting && <span aria-hidden="true">→</span>}
      </button>

      <div className="flex flex-col gap-2 rounded-[8px] border border-border-light bg-stone p-5">
        <p className="text-[13px] leading-[1.55] text-ink-secondary">{t("infoBox")}</p>
      </div>

      <div className="border-t border-border-light pt-6 text-center">
        <p className="text-[13px] text-ink-secondary">
          {t("haveAccount")}{" "}
          <Link href="/login" className="font-semibold text-terracotta hover:underline">
            {t("loginLink")}
          </Link>
        </p>
      </div>
    </form>
  );
}