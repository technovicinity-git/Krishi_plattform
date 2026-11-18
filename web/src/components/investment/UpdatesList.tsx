import { useLocale, useTranslations } from "next-intl";
import { formatBDT } from "@/lib/utils";
import { updatePhotoUrl } from "@/lib/investments/photo-url";
import { StatusBadge, type BadgeTone } from "@/components/dashboard/ui";

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

const TYPE_TONE: Record<string, BadgeTone> = {
  stage_change: "success",
  fund_request: "warning",
  fund_disbursed: "success",
  purchase: "success",
  expense: "neutral",
  health_check: "info",
  photo_update: "neutral",
  note: "neutral",
  sale: "success",
  settlement: "success",
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
    <section className="rounded-2xl border border-border-light bg-white">
      <div className="border-b border-border-light px-6 py-4">
        <h2 className="text-[15px] font-semibold text-ink">{t("heading")}</h2>
      </div>
      {updates.length === 0 ? (
        <p className="px-6 py-6 text-[13px] text-ink-muted">{emptyMessage ?? t("empty")}</p>
      ) : (
        <ol className="flex flex-col px-6 py-5">
          {updates.map((u, i) => {
            const photo = updatePhotoUrl(u.photoPath);
            return (
              <li key={u.id} className="relative flex gap-4 pb-6 last:pb-0">
                {i < updates.length - 1 && (
                  <span aria-hidden="true" className="absolute top-4 bottom-0 left-[7px] w-px bg-border-light" />
                )}
                <span
                  aria-hidden="true"
                  className="relative z-10 mt-1 h-[15px] w-[15px] shrink-0 rounded-full border-[3px] border-white bg-brand ring-1 ring-brand/30"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={TYPE_TONE[u.updateType] ?? "neutral"}>
                      {t.has(`type.${u.updateType}`) ? t(`type.${u.updateType}`) : u.updateType}
                    </StatusBadge>
                    <span className="text-[11.5px] text-ink-muted">
                      {new Date(u.createdAt).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                      {u.authorRole && (
                        <> · {tr.has(u.authorRole) ? tr(u.authorRole) : u.authorRole}</>
                      )}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-[14px] font-semibold text-ink">{u.title}</span>
                    {u.amount !== null && u.amount > 0 && (
                      <span className="text-[13px] font-bold text-green-deep">{formatBDT(u.amount)}</span>
                    )}
                  </div>
                  {u.body && (
                    <p className="whitespace-pre-line text-[13px] leading-[1.55] text-ink-secondary">
                      {u.body}
                    </p>
                  )}
                  {photo && (
                    <a href={photo} target="_blank" rel="noopener noreferrer" className="mt-1 block w-fit">
                      {/* eslint-disable-next-line @next/next/no-img-element -- storage URL, sizes vary */}
                      <img
                        src={photo}
                        alt={u.title}
                        loading="lazy"
                        className="h-36 w-auto max-w-full rounded-xl border border-border-light object-cover transition-opacity hover:opacity-90"
                      />
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
