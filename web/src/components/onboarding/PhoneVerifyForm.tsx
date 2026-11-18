"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { FormInput } from "@/components/auth/FormInput";
import { FormCheckbox } from "@/components/auth/FormCheckbox";
import { OTPInput } from "@/components/auth/OTPInput";
import { Heading } from "@/components/ui/Heading";

export function PhoneVerifyForm() {
  const t = useTranslations("onboarding.step1.form");

  // TODO (Supabase wiring batch): real values from session
  const fullName = "Tanvir Rahman";
  const phone = "1712345678";
  const email = "tanvir.rahman@gmail.com";

  const [agreed, setAgreed] = useState(true);
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [submitting, setSubmitting] = useState(false);

  const isComplete = code.every((c) => c !== "");
  const canResend = secondsLeft === 0;

  useEffect(() => {
    if (!otpSent || secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpSent, secondsLeft]);

  const handleSendOtp = () => {
    setOtpSent(true);
    setSecondsLeft(30);
    console.log("[stub] send OTP");
  };

  const handleResend = () => {
    if (!canResend) return;
    setSecondsLeft(30);
    console.log("[stub] resend OTP");
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete || !agreed) return;
    setSubmitting(true);
    console.log("[stub] verify OTP", { code: code.join("") });
    setTimeout(() => {
      setSubmitting(false);
      // TODO: navigate to /onboarding/kyc
    }, 800);
  };

  return (
    <form onSubmit={handleVerify} className="flex w-full max-w-[560px] flex-col gap-7">
      <div className="flex flex-col gap-3">
        <Heading as="h2" size="subsection" className="lg:text-[32px]">
          {t("heading")}
        </Heading>
        <p className="text-[14px] leading-[1.6] text-ink-secondary">
          {t("subheading")}
        </p>
      </div>

      <div className="flex flex-col gap-5">
        <FormInput
          label={t("fullNameLabel")}
          name="fullName"
          value={fullName}
          prefilled
          required
        />
        <FormInput
          label={t("phoneLabel")}
          name="phone"
          type="tel"
          value={`+880 ${phone}`}
          prefilled
          required
        />
        <FormInput
          label={t("emailLabel")}
          name="email"
          type="email"
          value={email}
          prefilled
        />
      </div>

      <FormCheckbox id="updates" checked={agreed} onChange={setAgreed}>
        {t("agreeUpdates")}
      </FormCheckbox>

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-ink">
          {t("otpWillBeSentTo", { phone: `+880 ${phone}` })}
        </span>
      </div>

      {/* Send OTP */}
      {!otpSent && (
        <button
          type="button"
          onClick={handleSendOtp}
          className="inline-flex h-[52px] w-full items-center justify-center rounded-[8px] bg-brand text-[15px] font-bold text-white transition-colors hover:bg-brand-hover"
        >
          {t("sendOtp")}
        </button>
      )}

      {/* OTP entry — only after sending */}
      {otpSent && (
        <>
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-ink-nav">
              {t("codeLabel")}
            </span>
            <OTPInput value={code} onChange={setCode} length={6} autoFocus />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend}
              className="text-[13px] font-semibold text-brand hover:underline disabled:cursor-not-allowed disabled:text-ink-muted disabled:no-underline"
            >
              {canResend
                ? t("resendOtp")
                : t("resendIn", { seconds: String(secondsLeft).padStart(2, "0") })}
            </button>
          </div>

          <button
            type="submit"
            disabled={!isComplete || submitting}
            className="inline-flex h-[52px] w-full items-center justify-center rounded-[8px] bg-brand text-[15px] font-bold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
          >
            {submitting ? t("verifying") : t("verifyAndContinue")}
          </button>
        </>
      )}

      <p className="text-center text-[11px] leading-tight text-ink-muted">
        {t("securityNote")}
      </p>
    </form>
  );
}