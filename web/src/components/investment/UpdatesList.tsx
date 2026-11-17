import { useLocale, useTranslations } from "next-intl";

interface Update {
  id: string;
  updateType: string;
  title: string;
  body: string | null;
  photoPath: string | null;
  amount: number | null;
  createdAt: string;
  authorRole: string | null;
}

const TYPE_COLORS: Record<string, string> = {
  stage_change: "bg-[#E8F0EA] text-green-deep",
  fund_request: "bg-[#FEF6E5] text-[#C48A2E]",
  fund_disbursed: "bg-[#E8F0EA] text-green-deep",
  purchase: "bg-[#FEF6E5] text-[#C48A2E]",
  expense: "bg-stone text-ink-muted",
  health_check: "bg-[#FAF0ED] text-terracotta",
  photo_update: "bg-stone text-ink-muted",
  note: "bg-stone text-ink-muted",
  sale: "bg-[#E8F0EA] text-green-deep",
};

export function UpdatesList({
  updates,
  emptyMessage,
}: {
  updates: Update[];
  emptyMessage?: string;
}) {
  const t = useTranslations("app.updates");
  const tr = useTranslations("app.roles");
  const locale = useLocale();
  return (
    <div className="rounded-xl border border-border-light bg-white p-6">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
        {t("heading")}
      </h2>
      {updates.length === 0 ? (
        <p className="mt-4 text-[13px] text-ink-muted">{emptyMessage ?? t("empty")}</p>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {updates.map((u) => (
            <div
              key={u.id}
              className="flex gap-3 border-b border-border-light pb-4 last:border-b-0 last:pb-0"
            >
              <div className="flex flex-col items-center pt-1">
                <div className="h-2 w-2 rounded-full bg-terracotta" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                      TYPE_COLORS[u.updateType] ?? "bg-stone text-ink-muted"
                    }`}
                  >
                    {t.has(`type.${u.updateType}`) ? t(`type.${u.updateType}`) : u.updateType}
                  </span>
                  <span className="text-[11px] text-ink-muted">
                    {new Date(u.createdAt).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  {u.authorRole && (
                    <span className="text-[10px] uppercase text-ink-muted">
                      · {tr.has(u.authorRole) ? tr(u.authorRole) : u.authorRole}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-[13px] font-semibold text-ink">
                  {u.title}
                </div>
                {u.body && (
                  <p className="mt-0.5 text-[12px] leading-[1.5] text-ink-secondary">
                    {u.body}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}