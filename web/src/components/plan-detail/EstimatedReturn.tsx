import { useTranslations } from "next-intl";
import { formatRoi } from "@/lib/utils";

interface Props {
  roiMin: number;
  roiMax: number;
}

export function EstimatedReturn({ roiMin, roiMax }: Props) {
  const t = useTranslations("planDetail.estimatedReturn");
  const ta = useTranslations("app.planDetail");
  return (
    <div className="rounded-2xl border border-border-light bg-white p-8">
      <h2 className="font-serif text-[24px] text-ink">{t("heading")}</h2>
      <div className="mt-2 text-[40px] font-bold text-brand">
        {formatRoi(roiMin, roiMax)}
      </div>
      <p className="mt-2 text-[13px] text-ink-muted">
        {ta("roiDisclaimer")}
      </p>
    </div>
  );
}