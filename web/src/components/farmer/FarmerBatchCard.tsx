import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { formatBDT } from "@/lib/utils";
import { StatusBadge, rowActionClass, toneFor } from "@/components/dashboard/ui";

/** The farmer's part of a batch, in order. "sold" still needs the farmer: send the money. */
export const FARMER_STEPS = ["awaiting_purchase", "growing_care", "sale_pending", "sold", "settled"] as const;

export interface FarmerBatch {
  id: string;
  reference: string;
  units: number;
  stage: string;
  createdAt: string;
  planEn: string | null;
  planBn: string | null;
  stewardName: string | null;
  animalAllocation: number;
  careAllocation: number;
  /** Animals still in care (not sold or dead), when known. */
  animalsActive?: number;
}

/**
 * One batch as a card: plan, stage, a step bar, steward and budgets. Used on
 * the farmer dashboard and the Batches page. `highlight` marks a batch that
 * needs the farmer; `note` replaces the "assigned" date (e.g. "Krishi is
 * checking your payment").
 */
export async function FarmerBatchCard({
  batch,
  highlight = false,
  note,
}: {
  batch: FarmerBatch;
  highlight?: boolean;
  note?: string;
}) {
  const [t, tst, tb, locale] = await Promise.all([
    getTranslations("app.farmerDash"),
    getTranslations("app.stage"),
    getTranslations("app.farmerBatches"),
    getLocale(),
  ]);
  const bn = locale === "bn";
  const plan = (bn ? batch.planBn : batch.planEn) ?? batch.planEn ?? batch.reference;
  const step = Math.max(0, FARMER_STEPS.indexOf(batch.stage as (typeof FARMER_STEPS)[number]));
  const date = new Date(batch.createdAt).toLocaleDateString(bn ? "bn-BD" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <Link
      href={`/farmer/investments/${batch.id}`}
      className={cn(
        "group flex flex-col gap-4 rounded-2xl border bg-white p-6 transition-[translate,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-[0_12px_28px_-18px_rgba(0,0,0,0.25)]",
        highlight ? "border-[#EBD9A8] ring-1 ring-[#EBD9A8]/60" : "border-border-light",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="font-mono text-[11px] font-semibold text-ink-muted">{batch.reference}</span>
          <h3 className="font-serif text-[21px] leading-tight text-ink">{plan}</h3>
          <span className="text-[12px] text-ink-muted">
            {tb("units", { count: batch.units })}
            {batch.animalsActive !== undefined && batch.stage !== "settled" ? ` · ${tb("animals", { count: batch.animalsActive })}` : ""}
          </span>
        </div>
        <StatusBadge tone={toneFor(batch.stage)}>{tst.has(batch.stage) ? tst(batch.stage) : batch.stage}</StatusBadge>
      </div>

      {/* Where this batch is */}
      <div className="flex flex-col gap-1.5">
        <div className="flex gap-1">
          {FARMER_STEPS.map((s, i) => (
            <span key={s} className={cn("h-1.5 flex-1 rounded-full", i <= step ? "bg-brand" : "bg-stone")} />
          ))}
        </div>
        <span className="text-[11px] text-ink-muted">{t("stepOf", { step: step + 1, total: FARMER_STEPS.length })}</span>
      </div>

      <dl className="grid grid-cols-3 gap-3 rounded-xl bg-cream px-4 py-3 text-[12px]">
        <div className="flex min-w-0 flex-col gap-0.5">
          <dt className="text-ink-muted">{t("steward")}</dt>
          <dd className="truncate font-semibold text-ink">{batch.stewardName ?? "—"}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-ink-muted">{t("animalBudget")}</dt>
          <dd className="font-semibold text-ink">{formatBDT(batch.animalAllocation * batch.units)}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-ink-muted">{t("careBudget")}</dt>
          <dd className="font-semibold text-ink">{formatBDT(batch.careAllocation * batch.units)}</dd>
        </div>
      </dl>

      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] text-ink-muted">{note ?? `${t("started")} ${date}`}</span>
        {/* The whole card is the link; this just looks like its button. */}
        <span className={rowActionClass()}>{t("open")}</span>
      </div>
    </Link>
  );
}

/** Loads a farmer's batches with what the cards need. Server-only. */
export async function loadFarmerBatches(
  db: ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>,
  farmerId: string,
): Promise<FarmerBatch[]> {
  const { data } = await db
    .from("investments")
    .select(`
      id, reference, units, current_stage, created_at,
      offering:steward_plan_offerings!offering_id (
        users!steward_id ( full_name ),
        investment_plans ( name_en, name_bn, animal_allocation, care_allocation )
      )
    `)
    .eq("farmer_id", farmerId)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as {
    id: string;
    reference: string;
    units: number;
    current_stage: string | null;
    created_at: string;
    offering: {
      users: { full_name: string | null } | null;
      investment_plans: { name_en: string | null; name_bn: string | null; animal_allocation: number; care_allocation: number } | null;
    } | null;
  }[];
  return rows.map((r) => ({
    id: r.id,
    reference: r.reference,
    units: r.units,
    stage: r.current_stage ?? "",
    createdAt: r.created_at,
    planEn: r.offering?.investment_plans?.name_en ?? null,
    planBn: r.offering?.investment_plans?.name_bn ?? null,
    stewardName: r.offering?.users?.full_name ?? null,
    animalAllocation: Number(r.offering?.investment_plans?.animal_allocation ?? 0),
    careAllocation: Number(r.offering?.investment_plans?.care_allocation ?? 0),
  }));
}
