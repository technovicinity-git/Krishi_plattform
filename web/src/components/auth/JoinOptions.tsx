"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function JoinOptions() {
  const t = useTranslations("join");

  return (
    <div className="flex flex-col gap-8">
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

      {/* INVESTOR card */}
      <article className="flex flex-col gap-5 rounded-2xl border border-border-light bg-cream p-7 lg:p-8">
        <h2 className="font-serif text-[24px] leading-tight text-ink">
          {t("investorTitle")}
        </h2>
        <p className="text-[15px] leading-[1.6] text-ink-secondary">
          {t("investorDescription")}
        </p>
        <p className="text-[13px] leading-[1.5] text-ink-muted">
          {t("investorNote")}
        </p>
        <Link
          href="/register/investor"
          className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[8px] border border-border-light bg-white text-[14px] font-semibold text-ink transition-colors hover:bg-stone"
        >
          {t("investorCta")}
          <span aria-hidden="true">→</span>
        </Link>
      </article>

      {/* STEWARD card */}
      <article className="flex flex-col gap-5 rounded-2xl border border-border-light bg-cream p-7 lg:p-8">
        <h2 className="font-serif text-[24px] leading-tight text-ink">
          {t("stewardTitle")}
        </h2>
        <p className="text-[15px] leading-[1.6] text-ink-secondary">
          {t("stewardDescription")}
        </p>
        <p className="text-[13px] leading-[1.5] text-ink-muted">
          {t("stewardNote")}
        </p>
        <Link
          href="/steward/register"
          className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[8px] border border-border-light bg-white text-[14px] font-semibold text-ink transition-colors hover:bg-stone"
        >
          {t("stewardCta")}
          <span aria-hidden="true">→</span>
        </Link>
      </article>

      {/* FARMER info box */}
      <div className="flex flex-col gap-2 rounded-2xl border border-border-light bg-stone p-6">
        <span className="text-[14px] font-bold text-ink">{t("farmerTitle")}</span>
        <p className="text-[13px] leading-[1.6] text-ink-secondary">
          {t("farmerBody")}
        </p>
      </div>

      {/* Footer link */}
      <div className="border-t border-border-light pt-6 text-center">
        <p className="text-[13px] text-ink-secondary">
          {t("haveAccount")}{" "}
          <Link
            href="/login"
            className="font-semibold text-terracotta hover:underline"
          >
            {t("loginLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}