import { getLocale, getTranslations } from "next-intl/server";
import { cn } from "@/lib/cn";
import { NavIcon } from "@/components/dashboard/NavIcon";

/**
 * "Download PDF" in the page's language, plus a small link for the other
 * language. `endpoint` is an API path such as "/api/reports/wallet".
 */
export async function ReportDownload({
  endpoint,
  locale: forced,
  className,
}: {
  endpoint: string;
  /** Force a language (the admin console is English-only). */
  locale?: "en" | "bn";
  className?: string;
}) {
  const t = await getTranslations("app.reports");
  const locale = forced ?? ((await getLocale()) === "bn" ? "bn" : "en");
  const other = locale === "bn" ? "en" : "bn";
  const sep = endpoint.includes("?") ? "&" : "?";

  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1", className)}>
      <a
        href={`${endpoint}${sep}lang=${locale}`}
        download
        className="inline-flex h-[38px] items-center gap-2 rounded-[8px] border border-border-light bg-white px-4 text-[13px] font-semibold text-ink-nav transition-colors hover:border-brand/50 hover:bg-brand-tint/50"
      >
        <NavIcon name="receipt" className="h-4 w-4 text-brand" />
        {t("download")}
      </a>
      {!forced && (
        <a href={`${endpoint}${sep}lang=${other}`} download className="text-[12px] font-semibold text-brand hover:underline">
          {other === "bn" ? t("downloadBn") : t("downloadEn")}
        </a>
      )}
    </div>
  );
}
