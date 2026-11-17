"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { passwordSchema } from "@/lib/auth/schemas";
import { OTPInput } from "./OTPInput";
import { FormPasswordInput } from "./FormPasswordInput";

type Step = "otp" | "password";

export function ResetPasswordForm() {
  const t = useTranslations("auth.reset");
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") ?? "";

  const [step, setStep] = useState<Step>("otp");
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const canResend = secondsLeft === 0;
  const isCodeComplete = code.every((c) => c !== "");

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  useEffect(() => {
    if (!phone) return;
    fetch(`/api/dev/latest-otp?phone=${encodeURIComponent(phone)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.otp) setDevOtp(d.otp);
      })
      .catch(() => {});
  }, [phone]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCodeComplete) return;
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp: code.join("") }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? t("errors.invalidOtp"));
        setSubmitting(false);
        return;
      }

      // Verified — move to password step
      setError(null);
      setSubmitting(false);
      setStep("password");
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t("errors.generic"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, newPassword: password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Failed to update password");
        setSubmitting(false);
        return;
      }

      router.push("/login?reset=success");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || !phone) return;
    setSecondsLeft(30);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const r = await fetch(
        `/api/dev/latest-otp?phone=${encodeURIComponent(phone)}`,
      );
      if (r.ok) {
        const d = await r.json();
        if (d?.otp) setDevOtp(d.otp);
      }
    } catch {
      /* noop */
    }
  };

  if (step === "otp") {
    return (
      <form onSubmit={handleVerifyCode} className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.02em] text-sage">
            {t("otpEyebrow")}
          </span>
          <h1 className="font-serif text-[36px] leading-[1.1] text-ink lg:text-[42px]">
            {t("otpHeading")}
          </h1>
          <p className="text-[15px] leading-[1.6] text-ink-secondary">
            {t("otpSubheading")}
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[13px] text-ink-secondary">{t("codeSentTo")}</span>
          <span className="text-[16px] font-semibold text-ink">{phone}</span>
        </div>

        {devOtp && (
          <div className="rounded-[8px] border-2 border-dashed border-terracotta bg-[#FAF0ED] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="rounded-[3px] bg-terracotta px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.02em] text-white">
                Dev Mode
              </span>
              <span className="text-[12px] text-ink-secondary">
                SMS not sent — OTP for testing:
              </span>
            </div>
            <div className="mt-1.5 text-[24px] font-bold tracking-[0.15em] text-terracotta">
              {devOtp}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold uppercase tracking-[0.02em] text-ink-nav">
            {t("codeLabel")}
          </span>
          <OTPInput value={code} onChange={setCode} length={6} autoFocus />
          <p className="text-[12px] text-ink-muted">{t("pasteHint")}</p>
        </div>

        {error && (
          <div className="rounded-[8px] border border-[#F0C9C0] bg-[#FAF0ED] px-4 py-3 text-[13px] text-[#A13D2B]">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!isCodeComplete || submitting}
          className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[8px] bg-terracotta text-[15px] font-bold text-white transition-colors hover:bg-[#B3634A] disabled:opacity-60"
        >
          {submitting ? t("otpSubmitting") : t("otpSubmit")}
          {!submitting && <span aria-hidden="true">→</span>}
        </button>

        <div className="flex flex-col gap-3 border-t border-border-light pt-6">
          <span className="text-[13px] text-ink-secondary">
            {t("didNotReceive")}
          </span>
          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend}
            className="inline-flex h-[44px] w-full items-center justify-center rounded-[8px] bg-stone text-[13px] font-semibold text-ink-secondary transition-colors hover:bg-[#DDD8D0] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {canResend
              ? t("resend")
              : t("resendIn", { seconds: String(secondsLeft).padStart(2, "0") })}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleUpdatePassword} className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.02em] text-sage">
          {t("pwEyebrow")}
        </span>
        <h1 className="font-serif text-[36px] leading-[1.1] text-ink lg:text-[42px]">
          {t("pwHeading")}
        </h1>
        <p className="text-[15px] leading-[1.6] text-ink-secondary">
          {t("pwSubheading")}
        </p>
      </div>

      <div className="flex flex-col gap-5">
        <FormPasswordInput
          label={t("newPasswordLabel")}
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
        {submitting ? t("pwSubmitting") : t("pwSubmit")}
        {!submitting && <span aria-hidden="true">→</span>}
      </button>

      <div className="flex justify-center border-t border-border-light pt-6">
        <button
          type="button"
          onClick={() => {
            setStep("otp");
            setCode(Array(6).fill(""));
            setError(null);
          }}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-nav hover:text-ink"
        >
          <span aria-hidden="true">←</span>
          {t("changeCode")}
        </button>
      </div>
    </form>
  );
}