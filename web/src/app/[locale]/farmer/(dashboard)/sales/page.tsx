import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapSale, SALE_COLUMNS, type InvestmentSale } from "@/lib/investments/detail";
import { formatBDT } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { EmptyState, PageHeader, StatCard, StatusBadge, type BadgeTone } from "@/components/dashboard/ui";
import { RecordSaleButton, SendMoneyButton } from "@/components/investment/FarmerSaleActions";

export const dynamic = "force-dynamic";

const SALE_TONE: Record<string, BadgeTone> = {
  pending_review: "info",
  rejected: "danger",
  awaiting_remittance: "warning",
  remittance_submitted: "info",
  settled: "success",
};

interface Batch {
  id: string;
  reference: string;
  units: number;
  stage: string;
  plan: string;
}

/**
 * Farmer's sales in one place: batches ready to sell, sale money to send to
 * Krishi, sales waiting on the steward/admin, and settled sales with the
 * farmer's profit share.
 */
export default async function FarmerSalesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "farmer") redirect("/login");

  const db = createAdminClient();
  const bn = (await getLocale()) === "bn";
  const [t, ts] = await Promise.all([getTranslations("app.farmerSales"), getTranslations("app.saleStatus")]);

  const { data: invRows } = await db
    .from("investments")
    .select("id, reference, units, current_stage, offering:steward_plan_offerings!offering_id ( investment_plans ( name_en, name_bn ) )")
    .eq("farmer_id", user.id)
    .order("created_at", { ascending: false });

  const batches: Batch[] = (invRows ?? []).map((r) => {
    const plan = (r.offering as unknown as { investment_plans: { name_en: string | null; name_bn: string | null } | null } | null)
      ?.investment_plans;
    return {
      id: r.id,
      reference: r.reference,
      units: r.units,
      stage: r.current_stage ?? "",
      plan: (bn ? plan?.name_bn : plan?.name_en) ?? plan?.name_en ?? "—",
    };
  });
  const ids = batches.map((b) => b.id);
  const byId = new Map(batches.map((b) => [b.id, b]));

  const [{ data: saleRows }, { data: settlementRows }, { data: animalRows }] = ids.length
    ? await Promise.all([
        db.from("investment_sales").select(`investment_id, ${SALE_COLUMNS}`).in("investment_id", ids),
        db.from("investment_settlements").select("investment_id, farmer_share, net_result, outcome").in("investment_id", ids),
        db.from("animals").select("id, investment_id, tag, ear_tag, current_weight_kg, status").in("investment_id", ids).neq("status", "sold").order("tag"),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const sales = new Map<string, InvestmentSale>(
    (saleRows ?? []).map((r) => [(r as { investment_id: string }).investment_id, mapSale(r)]),
  );
  const settlements = new Map(
    (settlementRows ?? []).map((s) => [s.investment_id, { share: Number(s.farmer_share), net: Number(s.net_result), outcome: s.outcome }]),
  );
  const activeAnimals = new Map<string, { id: string; tag: string; earTag: string | null; currentWeightKg: number | null; status: string }[]>();
  for (const a of animalRows ?? []) {
    const list = activeAnimals.get(a.investment_id) ?? [];
    list.push({ id: a.id, tag: a.tag, earTag: a.ear_tag, currentWeightKg: a.current_weight_kg === null ? null : Number(a.current_weight_kg), status: a.status });
    activeAnimals.set(a.investment_id, list);
  }

  // Groups
  const readyToSell = batches.filter((b) => b.stage === "growing_care");
  const toSend = [...sales.entries()].filter(([, s]) => s.status === "awaiting_remittance");
  const waiting = [...sales.entries()].filter(([, s]) => s.status === "pending_review" || s.status === "remittance_submitted");
  const settled = [...sales.entries()].filter(([, s]) => s.status === "settled");

  const { data: accountRows } = toSend.length
    ? await db
        .from("platform_accounts")
        .select("id, method, provider, account_name, account_number, branch_name")
        .eq("is_active", true)
    : { data: [] };
  const accounts = (accountRows ?? []).map((a) => ({
    id: a.id,
    method: a.method,
    provider: a.provider,
    accountName: a.account_name,
    accountNumber: a.account_number,
    branchName: a.branch_name,
  }));

  const totalSold = [...sales.values()].filter((s) => s.status !== "rejected").reduce((sum, s) => sum + s.saleAmount, 0);
  const totalShare = [...settlements.values()].reduce((sum, s) => sum + s.share, 0);
  const owed = toSend.reduce((sum, [, s]) => sum + s.saleAmount, 0);

  const date = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(bn ? "bn-BD" : "en-GB", { day: "2-digit", month: "short", year: "numeric" })
      : "—";

  const batchLine = (id: string) => {
    const b = byId.get(id);
    return (
      <Link href={`/farmer/investments/${id}`} className="flex min-w-0 flex-col">
        <span className="truncate text-[14px] font-semibold text-ink hover:text-brand">{b?.plan ?? "—"}</span>
        <span className="font-mono text-[11px] text-ink-muted">{b?.reference}</span>
      </Link>
    );
  };

  const nothing = readyToSell.length + toSend.length + waiting.length + settled.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={t("totalSold")} value={formatBDT(totalSold)} icon="tag" />
        <StatCard label={t("toSend")} value={formatBDT(owed)} tone={owed > 0 ? "warning" : "default"} />
        <StatCard label={t("yourShare")} value={formatBDT(totalShare)} tone="brand" icon="wallet" href="/farmer/wallet" />
      </div>

      {nothing && <EmptyState icon="tag" title={t("empty")} description={t("emptyHint")} />}

      {toSend.length > 0 && (
        <Section title={t("sendHeading")} hint={t("sendHint")}>
          {toSend.map(([id, s]) => (
            <Row key={id}>
              {batchLine(id)}
              <div className="flex flex-col gap-1 text-[12.5px] text-ink-secondary">
                <span>
                  <span className="font-mono">{s.reference}</span> · {t("soldOn", { date: date(s.saleDate) })}
                </span>
                {s.remitRejectionReason && <span className="text-danger">{t("notConfirmed", { reason: s.remitRejectionReason })}</span>}
              </div>
              <SendMoneyButton investmentId={id} amount={s.saleAmount} accounts={accounts} />
            </Row>
          ))}
        </Section>
      )}

      {readyToSell.length > 0 && (
        <Section title={t("readyHeading")} hint={t("readyHint")}>
          {readyToSell.map((b) => {
            const rejected = sales.get(b.id)?.status === "rejected" ? sales.get(b.id) : undefined;
            const animals = activeAnimals.get(b.id) ?? [];
            return (
              <Row key={b.id}>
                {batchLine(b.id)}
                <div className="flex flex-col gap-1 text-[12.5px] text-ink-secondary">
                  <span>{animals.length > 0 ? t("animalsActive", { count: animals.filter((a) => a.status === "active").length }) : t("units", { count: b.units })}</span>
                  {rejected?.rejectionReason && <span className="text-danger">{t("sentBack", { reason: rejected.rejectionReason })}</span>}
                </div>
                <RecordSaleButton investmentId={b.id} units={b.units} animals={animals} again={Boolean(rejected)} />
              </Row>
            );
          })}
        </Section>
      )}

      {waiting.length > 0 && (
        <Section title={t("waitingHeading")} hint={t("waitingHint")}>
          {waiting.map(([id, s]) => (
            <Row key={id}>
              {batchLine(id)}
              <span className="text-[12.5px] text-ink-secondary">
                <span className="font-mono">{s.reference}</span> · {formatBDT(s.saleAmount)}
              </span>
              <StatusBadge tone={SALE_TONE[s.status] ?? "neutral"}>{ts.has(s.status) ? ts(s.status) : s.status}</StatusBadge>
            </Row>
          ))}
        </Section>
      )}

      {settled.length > 0 && (
        <Section title={t("settledHeading")}>
          {settled.map(([id, s]) => {
            const st = settlements.get(id);
            return (
              <Row key={id}>
                {batchLine(id)}
                <span className="text-[12.5px] text-ink-secondary">
                  {t("soldFor", { amount: formatBDT(s.saleAmount) })} · {date(s.receivedAt)}
                </span>
                <div className="flex flex-col items-start gap-0.5 sm:items-end">
                  <span className="text-[15px] font-bold text-green-deep">{formatBDT(st?.share ?? 0)}</span>
                  <span className="text-[11.5px] text-ink-muted">
                    {st?.outcome === "loss" ? t("lossNoShare") : t("yourShareLabel")}
                  </span>
                </div>
              </Row>
            );
          })}
        </Section>
      )}
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border-light bg-white">
      <div className="border-b border-border-light px-6 py-4">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {hint && <p className="mt-0.5 text-[12.5px] text-ink-muted">{hint}</p>}
      </div>
      <ul className="divide-y divide-border-light">{children}</ul>
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <li className="grid grid-cols-1 items-center gap-3 px-6 py-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto]">
      {children}
    </li>
  );
}
