import { useTranslations } from "next-intl";
import { AuthCard } from "@/components/auth/AuthCard";
import { Link } from "@/i18n/navigation";

export default function StewardSubmittedPage() {
  const t = useTranslations("stewardSubmitted");
  const tf = useTranslations("app.forms");

  return (
    <AuthCard>
      <div className="flex flex-col gap-8">
        <div className="h-0.5 w-12 bg-brand" />

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

        <div className="flex flex-col gap-2 rounded-[10px] border border-border-light bg-white p-6">
          <span className="text-[12px] font-semibold text-ink-secondary">
            {t("cardLabel")}
          </span>
          <span className="text-[18px] font-bold text-ink">
            {t("cardStatus")}
          </span>
        </div>

        <div className="flex flex-col gap-2 rounded-[10px] border border-border-light bg-stone p-6">
          <span className="text-[14px] font-bold text-ink">
            {t("whatNextTitle")}
          </span>
          <p className="text-[13px] leading-[1.6] text-ink-secondary">
            {t("whatNextBody")}
          </p>
        </div>

        <Link
          href="/steward"
          className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[8px] bg-brand text-[15px] font-bold text-white transition-colors hover:bg-brand-hover"
        >
          {tf("goToStewardConsole")}
          <span aria-hidden="true">→</span>
        </Link>

        <div className="border-t border-border-light pt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-nav hover:text-ink"
          >
            <span aria-hidden="true">←</span>
            {t("backToKrishi")}
          </Link>
        </div>
      </div>
    </AuthCard>
  );
}