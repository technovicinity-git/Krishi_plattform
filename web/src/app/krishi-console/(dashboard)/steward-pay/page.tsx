import Link from "next/link";
import { requireAdmin } from "@/lib/admin/current-admin";
import { getStewardPayOverview, type StewardPayOverview } from "@/lib/investments/monthly-pay";
import { formatBDT } from "@/lib/utils";
import { EmptyState, PageHeader, StatCard, StatusBadge, Tabs } from "@/components/dashboard/ui";
import { ReverseMonthlyPayButton, SendMonthlyPayButton } from "@/components/admin/StewardPayActions";

export const dynamic = "force-dynamic";

const VIEWS = ["due", "sent", "batches", "losses"] as const;
type View = (typeof VIEWS)[number];

const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { timeZone: "Asia/Dhaka", day: "2-digit", month: "short", year: "numeric" });

const th = "px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted";
const td = "px-5 py-3.5 text-[13px] text-ink-secondary";

function BatchLink({ id, reference }: { id: string; reference: string }) {
  return (
    <Link href={`/krishi-console/investments/${id}`} className="font-mono text-[12.5px] font-semibold text-brand hover:underline">
      {reference}
    </Link>
  );
}

function Table({ head, children, min = 820 }: { head: string[]; children: React.ReactNode; min?: number }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border-light bg-white">
      <table className="w-full" style={{ minWidth: min }}>
        <thead className="border-b border-border-light bg-cream">
          <tr>
            {head.map((h) => (
              <th key={h} className={th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-light">{children}</tbody>
      </table>
    </div>
  );
}

/**
 * Steward monthly pay: months to send, what was sent, every batch's pay, and
 * the losses Krishi carried where monthly pay was more than the 5% share.
 */
export default async function AdminStewardPayPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  await requireAdmin();
  const { view: v } = await searchParams;
  const view: View = (VIEWS as readonly string[]).includes(v ?? "") ? (v as View) : "due";
  const data = await getStewardPayOverview();
  const { totals } = data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Steward pay"
        description="Krishi pays each steward a monthly amount for every batch, from the farmer being assigned until settlement. At settlement it is matched with the steward's 5% profit share; if the monthly pay was more, the difference is Krishi's loss."
        actions={
          <a href={`/api/admin/steward-pay/export?view=${view}`} className="inline-flex h-[38px] items-center rounded-[8px] border border-border-light bg-white px-4 text-[13px] font-semibold text-ink hover:border-brand/50">
            Download CSV
          </a>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Due now"
          value={formatBDT(totals.dueTotal)}
          hint={`${data.due.length} month${data.due.length === 1 ? "" : "s"} to send`}
          icon="wallet"
          tone={data.due.length ? "warning" : "default"}
        />
        <StatCard label="Sent this month" value={formatBDT(totals.sentThisMonth)} icon="coins" />
        <StatCard label="Sent in total" value={formatBDT(totals.sentTotal)} icon="history" />
        <StatCard
          label="Krishi losses"
          value={formatBDT(totals.lossTotal)}
          hint={`${totals.lossBatches} batch${totals.lossBatches === 1 ? "" : "es"} · Krishi's 5% on these settlements ${formatBDT(totals.platformShareTotal)}`}
          icon="clipboard"
        />
      </div>

      <Tabs
        localized={false}
        items={[
          { label: "Due", href: "/krishi-console/steward-pay", active: view === "due", count: data.due.length },
          { label: "Sent", href: "/krishi-console/steward-pay?view=sent", active: view === "sent" },
          { label: "By batch", href: "/krishi-console/steward-pay?view=batches", active: view === "batches" },
          { label: "Losses", href: "/krishi-console/steward-pay?view=losses", active: view === "losses", count: totals.lossBatches },
        ]}
      />

      {view === "due" && <DueView data={data} />}
      {view === "sent" && <SentView data={data} />}
      {view === "batches" && <BatchesView data={data} />}
      {view === "losses" && <LossesView data={data} />}
    </div>
  );
}

function DueView({ data }: { data: StewardPayOverview }) {
  if (data.due.length === 0) {
    return (
      <EmptyState
        icon="wallet"
        title="Nothing to send"
        description="A month becomes due when it ends. Months not sent by settlement are sent automatically then."
      />
    );
  }
  const stewards = [...new Set(data.due.map((d) => d.stewardId))];
  const batchPlan = new Map(data.batches.map((b) => [b.investmentId, b.plan]));
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#EBD9A8] bg-[#FBF5E6] px-5 py-4">
        <span className="text-[13.5px] font-semibold text-[#7A5418]">
          {data.due.length} month{data.due.length === 1 ? "" : "s"} for {stewards.length} steward{stewards.length === 1 ? "" : "s"} · {formatBDT(data.totals.dueTotal)}
        </span>
        <SendMonthlyPayButton
          items={data.due.map((d) => ({ investmentId: d.investmentId, monthNo: d.monthNo }))}
          total={data.totals.dueTotal}
          who={`${stewards.length} steward${stewards.length === 1 ? "" : "s"} (${data.due.length} months)`}
          label="Send all due"
          variant="primary"
        />
      </div>

      {stewards.map((sid) => {
        const rows = data.due.filter((d) => d.stewardId === sid);
        const total = rows.reduce((t, r) => t + r.amount, 0);
        const name = data.names.get(sid) ?? "—";
        return (
          <section key={sid} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[15px] font-semibold text-ink">
                <Link href={`/krishi-console/stewards/${sid}`} className="hover:text-brand">
                  {name}
                </Link>
                <span className="ml-2 text-[13px] font-normal text-ink-muted">
                  {rows.length} month{rows.length === 1 ? "" : "s"} · {formatBDT(total)}
                </span>
              </h2>
              {rows.length > 1 && (
                <SendMonthlyPayButton
                  items={rows.map((d) => ({ investmentId: d.investmentId, monthNo: d.monthNo }))}
                  total={total}
                  who={`${name} (${rows.length} months)`}
                  label={`Send all to ${name.split(" ")[0]}`}
                />
              )}
            </div>
            <Table head={["Batch", "Plan", "Month", "Period", "Amount", ""]}>
              {rows.map((d) => (
                <tr key={`${d.investmentId}-${d.monthNo}`} className="hover:bg-cream/60">
                  <td className={td}>
                    <BatchLink id={d.investmentId} reference={d.reference} />
                  </td>
                  <td className={td}>{batchPlan.get(d.investmentId) ?? "—"}</td>
                  <td className={td}>Month {d.monthNo}</td>
                  <td className={td}>
                    {day(d.periodStart)} – {day(d.periodEnd)}
                  </td>
                  <td className={`${td} font-semibold text-ink`}>{formatBDT(d.amount)}</td>
                  <td className={`${td} text-right`}>
                    <SendMonthlyPayButton
                      items={[{ investmentId: d.investmentId, monthNo: d.monthNo }]}
                      total={d.amount}
                      who={`${name} (${d.reference}, month ${d.monthNo})`}
                    />
                  </td>
                </tr>
              ))}
            </Table>
          </section>
        );
      })}
    </div>
  );
}

function SentView({ data }: { data: StewardPayOverview }) {
  if (data.payments.length === 0) return <EmptyState icon="history" title="No monthly pay sent yet" />;
  const refs = new Map(data.batches.map((b) => [b.investmentId, b]));
  return (
    <Table head={["Sent", "Steward", "Batch", "Month", "Period", "Amount", "Status"]} min={900}>
      {data.payments.map((p) => {
        const b = refs.get(p.investmentId);
        const settled = b?.stage === "settled";
        return (
          <tr key={p.id} className="align-top hover:bg-cream/60">
            <td className={td}>{day(p.sentAt)}</td>
            <td className={`${td} font-semibold text-ink`}>{data.names.get(p.stewardId) ?? "—"}</td>
            <td className={td}>{b ? <BatchLink id={p.investmentId} reference={b.reference} /> : "—"}</td>
            <td className={td}>
              Month {p.monthNo}
              {p.atSettlement && <span className="block text-[11.5px] text-ink-muted">at settlement</span>}
            </td>
            <td className={td}>
              {day(p.periodStart)} – {day(p.periodEnd)}
            </td>
            <td className={`${td} font-semibold ${p.status === "reversed" ? "text-ink-muted line-through" : "text-ink"}`}>
              {formatBDT(p.amount)}
            </td>
            <td className={td}>
              {p.status === "reversed" ? (
                <span className="flex flex-col gap-1">
                  <StatusBadge tone="neutral">Reversed</StatusBadge>
                  {p.reversalReason && <span className="text-[11.5px] text-ink-muted">{p.reversalReason}</span>}
                </span>
              ) : settled || p.atSettlement ? (
                <StatusBadge tone="success">Sent</StatusBadge>
              ) : (
                <ReverseMonthlyPayButton id={p.id} amount={p.amount} />
              )}
            </td>
          </tr>
        );
      })}
    </Table>
  );
}

function BatchesView({ data }: { data: StewardPayOverview }) {
  if (data.batches.length === 0) {
    return <EmptyState icon="briefcase" title="No batches with monthly pay yet" description="Months start when a farmer is assigned to a batch." />;
  }
  return (
    <Table head={["Batch", "Steward", "Started", "Rate", "Sent", "Due", "Settlement"]} min={1000}>
      {data.batches.map((b) => (
        <tr key={b.investmentId} className="align-top hover:bg-cream/60">
          <td className={td}>
            <BatchLink id={b.investmentId} reference={b.reference} />
            <span className="block text-[11.5px] text-ink-muted">{b.plan}</span>
          </td>
          <td className={`${td} font-semibold text-ink`}>{data.names.get(b.stewardId) ?? "—"}</td>
          <td className={td}>{day(b.start)}</td>
          <td className={td}>{b.rate ? `${formatBDT(b.rate)} / mo` : <span className="text-ink-muted">Not set</span>}</td>
          <td className={td}>
            {b.sentMonths} · {formatBDT(b.sentTotal)}
          </td>
          <td className={td}>{b.dueMonths ? <span className="font-semibold text-[#9A6B12]">{b.dueMonths} · {formatBDT(b.dueTotal)}</span> : "—"}</td>
          <td className={td}>
            {b.settled ? (
              <span className="flex flex-col gap-0.5 text-[12px]">
                <span>5% share {formatBDT(b.settled.share)}</span>
                <span>Top-up {formatBDT(b.settled.topup)}</span>
                {b.settled.platformLoss > 0 && <span className="font-semibold text-danger">Loss {formatBDT(b.settled.platformLoss)}</span>}
              </span>
            ) : (
              <StatusBadge tone="info">Running</StatusBadge>
            )}
          </td>
        </tr>
      ))}
    </Table>
  );
}

function LossesView({ data }: { data: StewardPayOverview }) {
  const rows = data.batches.filter((b) => b.settled && b.settled.platformLoss > 0);
  if (rows.length === 0) {
    return <EmptyState icon="clipboard" title="No losses" description="Every settled batch's 5% share covered its monthly pay." />;
  }
  return (
    <Table head={["Settled", "Batch", "Steward", "Months", "Monthly pay", "5% share", "Krishi loss"]} min={900}>
      {rows.map((b) => (
        <tr key={b.investmentId} className="hover:bg-cream/60">
          <td className={td}>
            <Link href={`/krishi-console/sales/${b.settled!.saleId}`} className="hover:text-brand">
              {day(b.settled!.settledAt)}
            </Link>
          </td>
          <td className={td}>
            <BatchLink id={b.investmentId} reference={b.reference} />
          </td>
          <td className={`${td} font-semibold text-ink`}>{data.names.get(b.stewardId) ?? "—"}</td>
          <td className={td}>{b.settled!.months}</td>
          <td className={td}>{formatBDT(b.settled!.monthlyTotal)}</td>
          <td className={td}>{formatBDT(b.settled!.share)}</td>
          <td className={`${td} font-semibold text-danger`}>{formatBDT(b.settled!.platformLoss)}</td>
        </tr>
      ))}
      <tr className="bg-cream">
        <td className={`${td} font-bold text-ink`} colSpan={6}>
          Total
        </td>
        <td className={`${td} font-bold text-danger`}>{formatBDT(data.totals.lossTotal)}</td>
      </tr>
    </Table>
  );
}
