"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { formatBDT } from "@/lib/utils";

/** Starts an SSLCommerz payment and sends the investor to the gateway page. */
export function PayOnlineButton({
  interestId,
  amount,
  locale,
  sandbox,
}: {
  interestId: string;
  amount: number;
  locale: "bn" | "en";
  sandbox: boolean;
}) {
  const t = useTranslations("app.onlinePayment");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/sslcommerz/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interest_id: interestId, locale }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error ?? t("failed"));
      window.location.assign(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failed"));
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-brand/40 bg-brand-tint/50 p-5">
      <div className="flex flex-col gap-1">
        <span className="text-[15px] font-semibold text-ink">{t("title")}</span>
        <span className="text-[12.5px] leading-[1.55] text-ink-secondary">{t("body")}</span>
      </div>
      <button
        type="button"
        onClick={pay}
        disabled={loading}
        className="inline-flex h-[48px] items-center justify-center rounded-[8px] bg-brand px-5 text-[14px] font-bold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
      >
        {loading ? t("redirecting") : t("pay", { amount: formatBDT(amount) })}
      </button>
      <span className="text-[11.5px] text-ink-muted">
        {t("secure")}
        {sandbox && ` · ${t("sandbox")}`}
      </span>
      {error && <span className="text-[12.5px] text-danger">{error}</span>}
    </div>
  );
}
