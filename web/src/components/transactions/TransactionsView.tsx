import NextLink from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { formatBDT } from "@/lib/utils";
import { EmptyState, PageHeader, StatCard, StatusBadge, type BadgeTone } from "@/components/dashboard/ui";
import {
  getLedger,
  kindsFor,
  parseLedgerFilters,
  investorProfit,
  type LedgerScope,
  type TxEntry,
  type TxKind,
} from "@/lib/transactions";

const STATUS_TONE: Record<string, BadgeTone> = {
  completed: "success",
  pending: "warning",
  processing: "info",
  rejected: "danger",
  refunded: "info",
  cancelled: "neutral",
};

/** Summary cards per viewer: which kinds to total. */
const SUMMARY: Record<string, TxKind[]> = {
  investor: ["deposit", "payout", "withdrawal", "refund"],
  farmer: ["fund_release", "remittance", "share", "withdrawal"],
  steward: ["share", "withdrawal", "adjustment"],
};

/**
 * Transaction history, shared by every panel. Filters come from the URL
 * (?type=&from=&to=&q=); the CSV download uses the same filters.
 */
export async function TransactionsView({
  scope,
  searchParams,
  basePath,
  batchHref,
  localized = true,
}: {
  scope: LedgerScope;
  searchParams: Record<string, string | string[] | undefined>;
  /** This page's path, e.g. "/portal/transactions". */
  basePath: string;
  /** Link to a batch for this viewer, or null for none. */
  batchHref: (investmentId: string) => string | null;
  /** false for the admin console (no locale prefix). */
  localized?: boolean;
}) {
  const filters = parseLedgerFilters(searchParams);
  const [{ entries, summary }, t, tPurpose, locale] = await Promise.all([
    getLedger(scope, filters),
    getTranslations("app.txn"),
    getTranslations("app.purpose"),
    getLocale(),
  ]);
  const platform = scope.kind === "platform";
  const profit = scope.kind === "user" && scope.role === "investor" ? await investorProfit(entries) : null;
  const roleKey = platform ? "platform" : scope.role;
  const kinds = kindsFor(scope);
  const LinkTag = localized ? Link : NextLink;
  const filtered = Boolean(filters.kinds?.length || filters.from || filters.to || filters.search);

  const kindLabel = (k: TxKind) => (platform ? t(`kindPlatform.${k}`) : t(`kind.${k}`));
  const date = (iso: string) =>
    new Date(iso).toLocaleString(locale === "bn" ? "bn-BD" : "en-GB", {
      timeZone: "Asia/Dhaka",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  // Translate the coded parts of a detail: payment method, fund purpose.
  const detail = (e: TxEntry) => {
    if (!e.detail) return null;
    if (e.kind === "deposit" && t.has(`method.${e.detail}`)) return t(`method.${e.detail}`);
    if (e.kind === "fund_release") return tPurpose.has(e.detail) ? tPurpose(e.detail) : e.detail.replace(/_/g, " ");
    if (e.kind === "remittance") {
      const [method, ...rest] = e.detail.split(" · ");
      return [t.has(`method.${method}`) ? t(`method.${method}`) : method, ...rest].join(" · ");
    }
    return e.detail;
  };

  // CSV download with the same filters.
  const exportQuery = new URLSearchParams();
  if (filters.kinds?.[0]) exportQuery.set("type", filters.kinds[0]);
  if (filters.from) exportQuery.set("from", filters.from);
  if (filters.to) exportQuery.set("to", filters.to);
  if (filters.search) exportQuery.set("q", filters.search);
  const exportHref = `/api/transactions/export${exportQuery.size ? `?${exportQuery}` : ""}`;

  const signed = (e: TxEntry) =>
    e.direction === "internal" ? formatBDT(e.amount) : `${e.direction === "in" ? "+" : "−"}${formatBDT(e.amount)}`;
  const amountClass = (e: TxEntry) =>
    e.status !== "completed"
      ? "text-ink-muted"
      : e.direction === "in"
        ? "text-green-deep"
        : e.direction === "out"
          ? "text-danger"
          : "text-ink-secondary";

  const meta = (e: TxEntry) => {
    const href = e.investmentId ? batchHref(e.investmentId) : null;
    return (
      <div className="flex flex-col gap-0.5 text-[12px] text-ink-muted">
        {platform && e.party && (
          <span className="font-semibold text-ink-secondary">
            {e.party}
            {e.partyRole ? ` · ${e.partyRole}` : ""}
          </span>
        )}
        {(e.reference || e.investmentRef) && (
          <span className="font-mono">
            {e.reference}
            {e.reference && e.investmentRef ? " · " : ""}
            {e.investmentRef &&
              (href ? (
                <LinkTag href={href} className="text-brand hover:underline">
                  {t("batch", { reference: e.investmentRef })}
                </LinkTag>
              ) : (
                t("batch", { reference: e.investmentRef })
              ))}
          </span>
        )}
        {detail(e) && <span className="line-clamp-2">{detail(e)}</span>}
        {e.direction === "internal" && <span className="italic">{t("internal")}</span>}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t(`subtitle_${roleKey}`)}
        actions={
          <a
            href={exportHref}
            className="inline-flex h-[38px] items-center justify-center rounded-[8px] border border-border-light bg-white px-4 text-[13px] font-semibold text-ink-secondary hover:bg-stone"
          >
            {t("download")}
          </a>
        }
      />

      <div className={cn("grid grid-cols-2 gap-4", profit ? "lg:grid-cols-3 xl:grid-cols-5" : "xl:grid-cols-4")}>
        {platform ? (
          <>
            <StatCard label={t("moneyIn")} value={formatBDT(summary.totalIn)} tone="brand" icon="coins" />
            <StatCard label={t("moneyOut")} value={formatBDT(summary.totalOut)} icon="wallet" />
            <StatCard label={t("held")} value={formatBDT(summary.totalIn - summary.totalOut)} />
            <StatCard label={t("revenue")} value={formatBDT(summary.byKind.platform_share ?? 0)} hint={t("pendingCount", { count: summary.pending })} />
          </>
        ) : (
          SUMMARY[scope.role].map((k, i) => (
            <StatCard
              key={k}
              label={t(`sum_${k}`)}
              value={formatBDT(summary.byKind[k] ?? 0)}
              tone={i === 0 ? "brand" : undefined}
              hint={i === 0 ? t("pendingCount", { count: summary.pending }) : undefined}
            />
          ))
        )}
        {profit && (
          <StatCard
            label={t("sum_profit")}
            value={formatBDT(profit.amount)}
            tone="brand"
            icon="chart"
            hint={t("sum_profitHint", { count: profit.batches })}
          />
        )}
      </div>

      {/* Filters (plain GET form, works without JavaScript) */}
      <form method="get" className="flex flex-wrap items-end gap-3 rounded-2xl border border-border-light bg-white p-4">
        <label className="flex min-w-[160px] flex-1 flex-col gap-1 text-[12px] font-semibold text-ink-secondary">
          {t("colType")}
          <select name="type" defaultValue={filters.kinds?.[0] ?? ""} className="h-[40px] rounded-[8px] border border-border-light bg-white px-3 text-[13px] text-ink">
            <option value="">{t("allTypes")}</option>
            {kinds.map((k) => (
              <option key={k} value={k}>
                {kindLabel(k)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[12px] font-semibold text-ink-secondary">
          {t("from")}
          <input type="date" name="from" defaultValue={filters.from} className="h-[40px] rounded-[8px] border border-border-light px-3 text-[13px] text-ink" />
        </label>
        <label className="flex flex-col gap-1 text-[12px] font-semibold text-ink-secondary">
          {t("to")}
          <input type="date" name="to" defaultValue={filters.to} className="h-[40px] rounded-[8px] border border-border-light px-3 text-[13px] text-ink" />
        </label>
        {platform && (
          <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-[12px] font-semibold text-ink-secondary">
            {t("search")}
            <input name="q" defaultValue={filters.search} className="h-[40px] rounded-[8px] border border-border-light px-3 text-[13px] text-ink" />
          </label>
        )}
        <div className="flex gap-2">
          <button type="submit" className="inline-flex h-[40px] items-center rounded-[8px] bg-brand px-4 text-[13px] font-bold text-white hover:bg-brand-hover">
            {t("apply")}
          </button>
          {filtered && (
            <LinkTag href={basePath} className="inline-flex h-[40px] items-center rounded-[8px] border border-border-light px-4 text-[13px] font-semibold text-ink-secondary hover:bg-stone">
              {t("clear")}
            </LinkTag>
          )}
        </div>
      </form>

      {entries.length === 0 ? (
        <EmptyState icon="coins" title={filtered ? t("emptyFiltered") : t("empty")} description={filtered ? undefined : t("emptyHint")} />
      ) : (
        <section className="overflow-hidden rounded-2xl border border-border-light bg-white">
          <div className="border-b border-border-light px-5 py-3 text-[12.5px] text-ink-secondary">{t("count", { count: entries.length })}</div>

          {/* Phones: cards */}
          <ul className="divide-y divide-border-light md:hidden">
            {entries.map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-[13.5px] font-semibold text-ink">{kindLabel(e.kind)}</span>
                  {meta(e)}
                  <span className="text-[11px] text-ink-muted">{date(e.at)}</span>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className={cn("text-[14px] font-bold", amountClass(e))}>{signed(e)}</span>
                  <StatusBadge tone={STATUS_TONE[e.status] ?? "neutral"}>{t.has(`status.${e.status}`) ? t(`status.${e.status}`) : e.status}</StatusBadge>
                </div>
              </li>
            ))}
          </ul>

          {/* Wider screens: table */}
          <table className="hidden w-full md:table">
            <thead className="border-b border-border-light bg-cream">
              <tr>
                {[t("colDate"), t("colType"), t("colDetails"), t("colStatus"), t("colAmount")].map((h, i) => (
                  <th key={h} className={cn("px-5 py-3 text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted", i === 4 ? "text-right" : "text-left")}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {entries.map((e) => (
                <tr key={e.id} className="align-top hover:bg-cream/60">
                  <td className="whitespace-nowrap px-5 py-3.5 text-[12.5px] text-ink-secondary">{date(e.at)}</td>
                  <td className="px-5 py-3.5 text-[13px] font-semibold text-ink">
                    {platform && e.adminHref ? (
                      <NextLink href={e.adminHref} className="hover:text-brand hover:underline">
                        {kindLabel(e.kind)}
                      </NextLink>
                    ) : (
                      kindLabel(e.kind)
                    )}
                  </td>
                  <td className="max-w-[360px] px-5 py-3.5">{meta(e)}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge tone={STATUS_TONE[e.status] ?? "neutral"}>{t.has(`status.${e.status}`) ? t(`status.${e.status}`) : e.status}</StatusBadge>
                  </td>
                  <td className={cn("whitespace-nowrap px-5 py-3.5 text-right text-[14px] font-bold", amountClass(e))}>{signed(e)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

