import { useTranslations } from "next-intl";
import { AlertTriangleIcon } from "@/components/icons";

export function RiskCard() {
  const t = useTranslations("planDetail.riskCard");

  return (
    <div className="flex flex-col gap-4 rounded-[8px] border-l-4 border-terracotta bg-white p-6">
      <div className="flex items-center gap-2">
        <AlertTriangleIcon className="h-4 w-4 text-terracotta" />
        <span className="text-[11px] font-bold uppercase tracking-[0.02em] text-terracotta">
          {t("heading")}
        </span>
      </div>
      <p className="text-[12px] leading-[1.6] text-ink-secondary">{t("body")}</p>
    </div>
  );
}