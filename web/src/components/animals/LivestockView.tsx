import { getLocale, getTranslations } from "next-intl/server";
import { cn } from "@/lib/cn";
import { formatBDT } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import type { AnimalWithBatch } from "@/lib/animals";
import { EmptyState, PageHeader, StatCard, StatusBadge, Tabs } from "@/components/dashboard/ui";
import { ANIMAL_TONE, weightGain } from "./shared";

const FILTERS = ["active", "sold", "dead", "all"] as const;
export type LivestockFilter = (typeof FILTERS)[number];

export function parseLivestockFilter(v: string | undefined): LivestockFilter {
  return FILTERS.includes(v as LivestockFilter) ? (v as LivestockFilter) : "active";
}

/** Every animal across the viewer's batches, shared by investor/farmer/steward. */
export async function LivestockView({
  animals,
  filter,
  basePath,
  batchHref,
  showFarmer = false,
}: {
  animals: AnimalWithBatch[];
  filter: LivestockFilter;
  /** e.g. "/portal/livestock" */
  basePath: string;
  batchHref: (investmentId: string) => string;
  showFarmer?: boolean;
}) {
  const t = await getTranslations("app.livestock");
  const ta = await getTranslations("app.animals");
  const bn = (await getLocale()) === "bn";

  const count = (s: string) => animals.filter((a) => a.status === s).length;
  // Average gain: animals still in care; when there are none with weights
  // (e.g. all sold), every animal that was weighed, except ones that died.
  const gainsOf = (list: typeof animals) => list.map(weightGain).filter((g): g is number => g !== null);
  const activeGains = gainsOf(animals.filter((a) => a.status === "active" || a.status === "death_reported"));
  const gains = activeGains.length ? activeGains : gainsOf(animals.filter((a) => a.status !== "dead"));
  const avgGain = gains.length ? Math.round((gains.reduce((s, g) => s + g, 0) / gains.length) * 10) / 10 : null;
  const avgGainHint = gains.length
    ? t(activeGains.length ? "avgGainActive" : "avgGainAll", { count: gains.length })
    : t("avgGainNone");
  // Animals with a death report waiting for the steward still count as active.
  const inFilter = (s: string) => s === filter || (filter === "active" && s === "death_reported");
  const shown = filter === "all" ? animals : animals.filter((a) => inFilter(a.status));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label={t("active")} value={count("active") + count("death_reported")} tone="brand" icon="leaf" />
        <StatCard label={t("sold")} value={count("sold")} />
        <StatCard label={t("dead")} value={count("dead")} />
        <StatCard
          label={t("avgGain")}
          value={avgGain !== null ? `${avgGain > 0 ? "+" : ""}${ta("kg", { value: avgGain })}` : "—"}
          hint={avgGainHint}
        />
      </div>

      <Tabs
        items={FILTERS.map((f) => ({
          label: t(`filter.${f}`),
          href: f === "active" ? basePath : `${basePath}?status=${f}`,
          active: f === filter,
        }))}
      />

      {shown.length === 0 ? (
        <EmptyState icon="leaf" title={animals.length === 0 ? t("empty") : t("emptyFilter")} description={animals.length === 0 ? t("emptyHint") : undefined} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border-light bg-white">
          <table className="w-full min-w-[760px]">
            <thead className="border-b border-border-light bg-cream">
              <tr>
                {[t("colAnimal"), t("colBatch"), ...(showFarmer ? [t("colFarmer")] : []), t("colWeight"), t("colGain"), t("colLast"), t("colStatus")].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {shown.map((a) => {
                const gain = weightGain(a);
                const last = a.records[0];
                return (
                  <tr key={a.id} className="align-top hover:bg-cream/60">
                    <td className="px-5 py-4">
                      <div className="text-[14px] font-bold text-ink">{a.tag}</div>
                      <div className="text-[11.5px] text-ink-muted">
                        {[a.earTag, a.breed].filter(Boolean).join(" · ") || <span className="font-mono">{a.reference}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Link href={batchHref(a.investmentId)} className="text-[13px] font-semibold text-brand hover:underline">
                        {bn ? a.batch.planBn : a.batch.planEn}
                      </Link>
                      <div className="font-mono text-[11px] text-ink-muted">{a.batch.reference}</div>
                    </td>
                    {showFarmer && <td className="px-5 py-4 text-[13px] text-ink-secondary">{a.batch.farmerName ?? "—"}</td>}
                    <td className="px-5 py-4 text-[13px] font-semibold text-ink">
                      {a.currentWeightKg !== null ? ta("kg", { value: a.currentWeightKg }) : "—"}
                    </td>
                    <td className={cn("px-5 py-4 text-[13px] font-semibold", gain === null ? "text-ink-muted" : gain >= 0 ? "text-green-deep" : "text-danger")}>
                      {gain === null ? "—" : `${gain >= 0 ? "+" : ""}${ta("kg", { value: gain })}`}
                    </td>
                    <td className="max-w-[240px] px-5 py-4 text-[12.5px] text-ink-secondary">
                      {last ? (
                        <>
                          <span className="font-semibold">{ta(`kind.${last.kind}`)}</span>
                          {last.weightKg !== null ? ` · ${ta("kg", { value: last.weightKg })}` : last.note ? ` · ${last.note}` : ""}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge tone={ANIMAL_TONE[a.status] ?? "neutral"}>{ta(`status.${a.status}`)}</StatusBadge>
                      {a.status === "sold" && a.salePrice !== null && (
                        <div className="mt-1 text-[11.5px] text-ink-muted">{formatBDT(a.salePrice)}</div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
