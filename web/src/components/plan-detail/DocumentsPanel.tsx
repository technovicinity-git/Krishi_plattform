import { useTranslations } from "next-intl";
import { ExternalLinkIcon } from "@/components/icons";

const DOCS = ["terms", "risk", "infoSheet"] as const;

export function DocumentsPanel() {
  const t = useTranslations("planDetail.documents");

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border-light bg-white p-7">
      <h3 className="text-[14px] font-bold uppercase tracking-[0.02em] text-ink">
        {t("heading")}
      </h3>

      <ul className="flex flex-col">
        {DOCS.map((key, i) => (
          <li
            key={key}
            className={`flex items-center justify-between gap-4 py-3 ${
              i < DOCS.length - 1 ? "border-b border-border-light" : ""
            }`}
          >
            <span className="text-[13px] font-semibold text-ink">
              {t(`items.${key}`)}
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand"
            >
              {t("view")}
              <ExternalLinkIcon />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}