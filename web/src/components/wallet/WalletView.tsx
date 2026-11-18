import { getLocale, getTranslations } from "next-intl/server";
import { cn } from "@/lib/cn";
import { Link } from "@/i18n/navigation";
import { formatBDT } from "@/lib/utils";
import { describeDestination, WITHDRAWAL_MIN, type Wallet } from "@/lib/wallet";
import {
  ButtonLink,
  PageHeader,
  Panel,
  StatCard,
  StatusBadge,
  type BadgeTone,
} from "@/components/dashboard/ui";
import { WithdrawButton } from "./WithdrawButton";
import { CancelWithdrawalButton } from "./CancelWithdrawalButton";

const WD_TONE: Record<string, BadgeTone> = {
  pending: "warning",
  paid: "success",
  rejected: "danger",
  cancelled: "neutral",
};

/**
 * Wallet page body shared by investor, farmer and steward.
 * `basePath` is the role's wallet route, e.g. "/portal/wallet".
 */
export async function WalletView({
  wallet,
  basePath,
  investmentHref,
}: {
  wallet: Wallet;
  basePath: string;
  /** Builds a link to a batch for transactions tied to one, or omit. */
  investmentHref?: (id: string) => string;
}) {
  const t = await getTranslations("app.wallet");
  const locale = await getLocale();
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const destination = wallet.payout
    ? describeDestination({
        method: wallet.payout.method,
        mfs_provider: wallet.payout.mfsProvider,
        mobile_number: wallet.payout.mobileNumber,
        bank_name: wallet.payout.bankName,
        bank_account_number: wallet.payout.bankAccountNumber,
      })
    : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={<WithdrawButton balance={wallet.balance} destination={destination} />}
      />

      {!wallet.payout && (
        <div className="flex flex-col gap-3 rounded-2xl border border-[#F0D9A6] bg-[#FEF6E5] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-[#7A5418]">{t("noPayout")}</p>
          <ButtonLink href={`${basePath}/payout`} variant="secondary">
            {t("addPayout")}
          </ButtonLink>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("available")} value={formatBDT(wallet.balance)} tone="brand" icon="wallet"
          hint={wallet.balance > 0 && wallet.balance < WITHDRAWAL_MIN ? t("belowMin", { min: formatBDT(WITHDRAWAL_MIN) }) : undefined} />
        <StatCard label={t("pending")} value={formatBDT(wallet.pending)} tone={wallet.pending > 0 ? "warning" : "default"} />
        <StatCard label={t("earned")} value={formatBDT(wallet.earned)} />
        <StatCard label={t("withdrawn")} value={formatBDT(wallet.withdrawn)} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel title={t("transactions")} bodyClassName="p-0">
          {wallet.transactions.length === 0 ? (
            <p className="px-6 py-6 text-[13px] text-ink-muted">{t("noTransactions")}</p>
          ) : (
            <ul className="divide-y divide-border-light">
              {wallet.transactions.map((tx) => {
                const href = tx.investmentId && investmentHref ? investmentHref(tx.investmentId) : null;
                return (
                  <li key={tx.id} className="flex items-center justify-between gap-4 px-6 py-3.5">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-[13.5px] font-semibold text-ink">
                        {t.has(`type.${tx.type}`) ? t(`type.${tx.type}`) : tx.type}
                      </span>
                      <span className="truncate text-[12px] text-ink-muted">
                        {fmtDate(tx.createdAt)}
                        {tx.description ? ` · ${tx.description}` : ""}
                        {href && (
                          <>
                            {" · "}
                            <Link href={href} className="font-semibold text-brand hover:underline">
                              {t("viewBatch")}
                            </Link>
                          </>
                        )}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 text-[15px] font-bold",
                        tx.amount > 0 ? "text-green-deep" : "text-ink",
                      )}
                    >
                      {tx.amount > 0 ? "+" : "−"}
                      {formatBDT(Math.abs(tx.amount))}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <div className="flex flex-col gap-6">
          <Panel
            title={t("payoutAccount")}
            actions={
              <ButtonLink href={`${basePath}/payout`} variant="secondary" className="h-[34px] px-3 text-[12px]">
                {wallet.payout ? t("change") : t("addPayout")}
              </ButtonLink>
            }
          >
            {wallet.payout ? (
              <div className="flex flex-col gap-1">
                <span className="text-[14px] font-semibold text-ink">{destination}</span>
                <span className="text-[12.5px] text-ink-secondary">{wallet.payout.accountHolderName}</span>
              </div>
            ) : (
              <p className="text-[13px] text-ink-muted">{t("noPayoutShort")}</p>
            )}
          </Panel>

          <Panel title={t("withdrawals")} bodyClassName="p-0">
            {wallet.withdrawals.length === 0 ? (
              <p className="px-6 py-6 text-[13px] text-ink-muted">{t("noWithdrawals")}</p>
            ) : (
              <ul className="divide-y divide-border-light">
                {wallet.withdrawals.map((w) => (
                  <li key={w.id} className="flex flex-col gap-1.5 px-6 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[15px] font-bold text-ink">{formatBDT(w.amount)}</span>
                      <StatusBadge tone={WD_TONE[w.status] ?? "neutral"}>
                        {t.has(`status.${w.status}`) ? t(`status.${w.status}`) : w.status}
                      </StatusBadge>
                    </div>
                    <span className="text-[12px] text-ink-muted">
                      <span className="font-mono">{w.reference}</span> · {fmtDate(w.createdAt)} · {w.destination}
                    </span>
                    {w.status === "paid" && w.payoutTxnId && (
                      <span className="text-[12px] text-ink-secondary">
                        {t("paidTxn", { txn: w.payoutTxnId })}
                      </span>
                    )}
                    {w.status === "rejected" && w.rejectionReason && (
                      <span className="text-[12px] text-danger">{w.rejectionReason}</span>
                    )}
                    {w.adminNote && <span className="text-[12px] text-ink-secondary">{w.adminNote}</span>}
                    {w.status === "pending" && (
                      <div>
                        <CancelWithdrawalButton id={w.id} reference={w.reference} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
