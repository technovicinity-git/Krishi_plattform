"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { OTPInput } from "./OTPInput";

export function OTPForm() {
  const t = useTranslations("auth.otp");
  const tErr = useTranslations("errors");
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") ?? "";

  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const canResend = secondsLeft === 0;
  const isComplete = code.every((c) => c !== "");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete) return;
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: code.join("") }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? tErr("invalidOtp"));
        setSubmitting(false);
        return;
      }

      router.push("/portal/profile");
      router.refresh();
    } catch {
      setError(tErr("network"));
      setSubmitting(false);
    }
  };

  const handleResend = () => {
    if (!canResend) return;
    setSecondsLeft(30);
    // Resend logic will be added in Phase 2 — for now, disabled.
    // (The user must reload /register/investor to trigger a new OTP.)
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

      <div className="flex flex-col gap-1">
        <span className="text-[13px] text-ink-secondary">{t("codeSentTo")}</span>
        <span className="text-[16px] font-semibold text-ink">{phone}</span>
      </div>

      {devOtp && (
        <div className="rounded-[8px] border-2 border-dashed border-brand bg-brand-tint px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="rounded-[3px] bg-brand px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.02em] text-white">
              Dev Mode
            </span>
            <span className="text-[12px] text-ink-secondary">
              SMS not sent — OTP for testing:
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
        <p className="text-[12px] text-ink-muted">{t("pasteHint")}</p>
      </div>

      {error && (
        <div className="rounded-[8px] border border-[#F0C9C0] bg-[#FAF0ED] px-4 py-3 text-[13px] text-[#A13D2B]">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!isComplete || submitting}
        className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[8px] bg-brand text-[15px] font-bold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
      >
        {submitting ? t("submitting") : t("submit")}
        {!submitting && <span aria-hidden="true">→</span>}
      </button>

      <div className="flex flex-col gap-4 border-t border-border-light pt-6">
        <div className="flex flex-col gap-2">
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

        <Link
          href="/login"
          className="text-center text-[13px] font-semibold text-brand hover:underline"
        >
          {t("changePhone")}
        </Link>
      </div>
    </form>
  );
}