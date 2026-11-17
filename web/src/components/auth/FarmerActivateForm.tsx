"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { FormInput } from "./FormInput";
import { FormPasswordInput } from "./FormPasswordInput";
import { OTPInput } from "./OTPInput";

export function FarmerActivateForm() {
  const t = useTranslations("farmerActivate");
  const tf = useTranslations("app.forms");
  const tcm = useTranslations("app.common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneFromUrl = searchParams.get("phone") ?? "";

  // Step 1: identify. Step 2: verify + set password.
  const [phone, setPhone] = useState(phoneFromUrl);
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const isCodeComplete = code.every((c) => c !== "");
  const hasPhone = phone.length >= 10;

  // Fetch dev OTP for the banner
  useEffect(() => {
    if (!phone || phone.length < 10) return;
    // Show OTP for dev convenience
    const e164 = phone.startsWith("+880")
      ? phone
      : `+880${phone.replace(/^0/, "")}`;
    fetch(`/api/dev/latest-otp?phone=${encodeURIComponent(e164)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.otp) setDevOtp(d.otp);
      })
      .catch(() => {});
  }, [phone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isCodeComplete) return;

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/farmer-activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          otp: code.join(""),
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? tf("failedActivate"));
        setSubmitting(false);
        return;
      }

      router.push("/farmer");
      router.refresh();
    } catch {
      setError(tcm("networkError"));
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

      {!hasPhone && (
        <FormInput
          label={tf("phoneLabel")}
          name="phone"
          type="tel"
          prefix="+880"
          value={phone}
          onChange={setPhone}
          required
          helper={tf("farmerPhoneHelper")}
        />
      )}

      {hasPhone && (
        <>
          <div className="flex flex-col gap-1">
            <span className="text-[13px] text-ink-secondary">
              {tf("activatingFor")}
            </span>
            <span className="text-[16px] font-semibold text-ink">
              +880 {phone.replace(/^0/, "")}
            </span>
          </div>

          {devOtp && (
            <div className="rounded-[8px] border-2 border-dashed border-brand bg-brand-tint px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="rounded-[3px] bg-brand px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.02em] text-white">
                  Dev Mode
                </span>
                <span className="text-[12px] text-ink-secondary">
                  Activation OTP for testing:
                </span>
              </div>
              <div className="mt-1.5 text-[24px] font-bold tracking-[0.15em] text-brand">
                {devOtp}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold uppercase tracking-[0.02em] text-ink-nav">
              {t("codeLabel")}
            </span>
            <OTPInput value={code} onChange={setCode} length={6} autoFocus />
          </div>

          <div className="flex flex-col gap-5">
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
          </div>
        </>
      )}

      {error && (
        <div className="rounded-[8px] border border-[#F0C9C0] bg-[#FAF0ED] px-4 py-3 text-[13px] text-[#A13D2B]">
          {error}
        </div>
      )}

      {!hasPhone && (
        <button
          type="submit"
          disabled
          className="hidden"
          aria-hidden="true"
        />
      )}

      {hasPhone && (
        <button
          type="submit"
          disabled={submitting || !isCodeComplete}
          className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[8px] bg-brand text-[15px] font-bold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
        >
          {submitting ? t("submitting") : t("submit")}
          {!submitting && <span aria-hidden="true">→</span>}
        </button>
      )}

      <div className="border-t border-border-light pt-6 text-center">
        <p className="text-[13px] text-ink-secondary">
          {t("alreadyActivated")}{" "}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            {t("loginLink")}
          </Link>
        </p>
      </div>
    </form>
  );
}