"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useDialog } from "@/components/ui/dialog-provider";

interface FarmerActivationPanelProps {
  farmerId: string;
  phone: string;
  devOtp: string | null;
}

const noopSubscribe = () => () => {};

/**
 * The page origin is only known in the browser. Reading it through
 * useSyncExternalStore renders "" on the server and during hydration, then
 * the real origin, so server and client markup always match.
 */
function useOrigin(): string {
  return useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => "",
  );
}

export function FarmerActivationPanel({
  farmerId,
  phone,
  devOtp,
}: FarmerActivationPanelProps) {
  const t = useTranslations("app.activation");
  const tc = useTranslations("app.common");
  const locale = useLocale();
  const router = useRouter();
  const { alert } = useDialog();
  const [resending, setResending] = useState(false);

  // Bangla is the default locale and has no URL prefix.
  const localePrefix = locale === "bn" ? "" : `/${locale}`;
  const activationUrl = `${useOrigin()}${localePrefix}/farmer/activate?phone=${encodeURIComponent(phone)}`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(activationUrl);
      await alert({
        title: t("copiedTitle"),
        message: t("copiedMessage"),
        variant: "success",
      });
    } catch {
      await alert({
        title: t("copyFailedTitle"),
        message: activationUrl,
        variant: "info",
      });
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await fetch(
        `/api/steward/farmers/${farmerId}/resend-activation`,
        { method: "POST" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await alert({
          title: t("resendFailedTitle"),
          message: data.error ?? t("tryAgain"),
          variant: "danger",
        });
        setResending(false);
        return;
      }
      await alert({
        title: t("regeneratedTitle"),
        message: devOtp ? t("regeneratedDev") : t("regeneratedSms"),
        variant: "success",
      });
      router.refresh();
      setResending(false);
    } catch {
      await alert({ title: tc("networkError"), variant: "danger" });
      setResending(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-[#F0D9A6] bg-[#FEF6E5] p-6">
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-bold text-[#7A5C1E]">
          {t("pendingTitle")}
        </span>
        <p className="text-[12px] leading-[1.6] text-[#7A5C1E]">
          {t("pendingBody")}
        </p>
      </div>

      {devOtp && (
        <div className="rounded-[8px] border border-dashed border-brand bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="rounded-[3px] bg-brand px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.02em] text-white">
              {t("devBadge")}
            </span>
            <span className="text-[11px] text-ink-secondary">
              {t("devHint")}
            </span>
          </div>
          <div className="mt-1.5 text-[24px] font-bold tracking-[0.15em] text-brand">
            {devOtp}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.02em] text-[#7A5C1E]">
          {t("linkLabel")}
        </span>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded-[6px] border border-border-light bg-white px-3 py-2.5 text-[11px] text-ink-secondary">
            {activationUrl}
          </code>
          <button
            type="button"
            onClick={handleCopyUrl}
            className="inline-flex h-[38px] shrink-0 items-center justify-center rounded-[6px] bg-white px-4 text-[12px] font-semibold text-ink-nav transition-colors hover:bg-stone"
          >
            {t("copy")}
          </button>
        </div>
      </div>

      <div className="border-t border-[#F0D9A6] pt-4">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="inline-flex h-[42px] items-center justify-center rounded-[8px] bg-brand px-5 text-[13px] font-bold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
        >
          {resending ? t("regenerating") : t("regenerate")}
        </button>
      </div>
    </div>
  );
}
