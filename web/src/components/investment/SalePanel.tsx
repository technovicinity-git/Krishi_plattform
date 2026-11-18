"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { formatBDT } from "@/lib/utils";
import { useDialog } from "@/components/ui/dialog-provider";
import { DetailRow, StatusBadge, type BadgeTone } from "@/components/dashboard/ui";
import { fieldClass } from "@/components/dashboard/Modal";
import type { InvestmentSale, InvestmentSettlement } from "@/lib/investments/detail";
import { SettlementSummary } from "./SettlementSummary";
import { RemitModal, type PlatformAccount } from "./RemitModal";

export type SaleViewer = "farmer" | "steward" | "investor" | "admin";

const SALE_TONE: Record<string, BadgeTone> = {
  pending_review: "info",
  rejected: "danger",
  awaiting_remittance: "warning",
  remittance_submitted: "info",
  settled: "success",
};

/** Sale, remittance and settlement of a batch, with the viewer's actions. */
export function SalePanel({
  investmentId,
  sale,
  settlement,
  viewer,
  accounts = [],
}: {
  investmentId: string;
  sale: InvestmentSale;
  settlement: InvestmentSettlement | null;
  viewer: SaleViewer;
  accounts?: PlatformAccount[];
}) {
  const t = useTranslations("app.sale");
  const ts = useTranslations("app.saleStatus");
  const tc = useTranslations("app.common");
  const locale = useLocale();
  const router = useRouter();
  const { alert, confirm } = useDialog();
  const [remitOpen, setRemitOpen] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const fmtDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  const review = async (action: "approve" | "reject") => {
    if (action === "approve") {
      const ok = await confirm({
        title: t("confirmTitle"),
        message: t("confirmMessage", { amount: formatBDT(sale.saleAmount) }),
        confirmLabel: t("confirmSale"),
        cancelLabel: tc("cancel"),
        variant: "success",
      });
      if (!ok) return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/steward/sales/${sale.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("actionFailed"));
      setRejecting(false);
      setReason("");
      router.refresh();
    } catch (err) {
      await alert({
        title: t("actionFailed"),
        message: err instanceof Error ? err.message : undefined,
        variant: "danger",
      });
    } finally {
      setBusy(false);
    }
  };

  const photo = sale.photoUrl;
  const proof = sale.remitProofUrl;
  const remitted = Boolean(sale.remittedAt) && sale.status !== "awaiting_remittance";

  return (
    <section className="rounded-2xl border border-border-light bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-light px-6 py-4">
        <div className="flex flex-col">
          <h2 className="text-[15px] font-semibold text-ink">{t("heading")}</h2>
          <span className="font-mono text-[11px] text-ink-muted">{sale.reference}</span>
        </div>
        <StatusBadge tone={SALE_TONE[sale.status] ?? "neutral"} className="text-[11px]">
          {ts.has(sale.status) ? ts(sale.status) : sale.status}
        </StatusBadge>
      </div>

      <div className="flex flex-col gap-5 px-6 py-5">
        <Notice sale={sale} viewer={viewer} />

        <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
          <div className="flex flex-col">
            <DetailRow label={t("saleAmount")} value={<strong className="text-green-deep">{formatBDT(sale.saleAmount)}</strong>} />
            <DetailRow label={t("animalsSold")} value={String(sale.animalsSold)} />
            <DetailRow label={t("saleDate")} value={fmtDate(sale.saleDate)} />
          </div>
          <div className="flex flex-col">
            <DetailRow label={t("buyer")} value={sale.buyerName ?? "—"} />
            {viewer !== "investor" && (
              <DetailRow label={t("buyerPhone")} value={sale.buyerPhone ?? "—"} />
            )}
            <DetailRow
              label={t("photo")}
              value={
                photo ? (
                  <a href={photo} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand hover:underline">
                    {t("view")}
                  </a>
                ) : (
                  "—"
                )
              }
            />
          </div>
        </div>
        {sale.note && <p className="rounded-xl bg-cream px-4 py-3 text-[13px] text-ink-secondary">{sale.note}</p>}

        {remitted && (
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-ink-muted">
              {t("remittance")}
            </span>
            <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
              <div className="flex flex-col">
                <DetailRow label={t("method")} value={sale.remitMethod ? t(`method_${sale.remitMethod}`) : "—"} />
                <DetailRow label={t("txnId")} value={sale.remitTxnId ?? "—"} />
              </div>
              <div className="flex flex-col">
                <DetailRow label={t("sender")} value={sale.remitSender ?? "—"} />
                <DetailRow
                  label={t("proof")}
                  value={
                    proof ? (
                      <a href={proof} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand hover:underline">
                        {t("view")}
                      </a>
                    ) : (
                      "—"
                    )
                  }
                />
              </div>
            </div>
            {sale.remitNote && (
              <p className="rounded-xl bg-cream px-4 py-3 text-[13px] text-ink-secondary">{sale.remitNote}</p>
            )}
          </div>
        )}

        {viewer === "farmer" && sale.status === "awaiting_remittance" && (
          <button
            type="button"
            onClick={() => setRemitOpen(true)}
            className="inline-flex h-[46px] items-center justify-center rounded-[8px] bg-brand px-5 text-[14px] font-bold text-white transition-colors hover:bg-brand-hover"
          >
            {t("sendMoney", { amount: formatBDT(sale.saleAmount) })}
          </button>
        )}

        {viewer === "steward" && sale.status === "pending_review" &&
          (rejecting ? (
            <div className="flex flex-col gap-2">
              <textarea
                rows={3}
                value={reason}
                placeholder={t("rejectPlaceholder")}
                onChange={(e) => setReason(e.target.value)}
                className={`${fieldClass} py-2.5`}
              />
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled={busy || reason.trim().length < 5}
                  onClick={() => review("reject")}
                  className="inline-flex h-[42px] flex-1 items-center justify-center rounded-[8px] bg-danger text-[13px] font-bold text-white disabled:opacity-50"
                >
                  {t("rejectSale")}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setRejecting(false)}
                  className="inline-flex h-[42px] flex-1 items-center justify-center rounded-[8px] border border-border-light text-[13px] font-semibold text-ink-secondary hover:bg-stone"
                >
                  {tc("cancel")}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                disabled={busy}
                onClick={() => review("approve")}
                className="inline-flex h-[44px] flex-1 items-center justify-center rounded-[8px] bg-brand text-[14px] font-bold text-white hover:bg-brand-hover disabled:opacity-50"
              >
                {busy ? tc("saving") : t("confirmSale")}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setRejecting(true)}
                className="inline-flex h-[44px] flex-1 items-center justify-center rounded-[8px] border border-border-light text-[14px] font-semibold text-danger hover:bg-[#FAF0ED] disabled:opacity-50"
              >
                {tc("reject")}
              </button>
            </div>
          ))}

        {settlement && (
          <div className="flex flex-col gap-3 border-t border-border-light pt-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-[15px] font-semibold text-ink">{t("settlementHeading")}</span>
              <span className="text-[12px] text-ink-muted">{fmtDate(settlement.settledAt)}</span>
            </div>
            <SettlementSummary
              breakdown={settlement}
              highlight={viewer === "admin" ? "platform" : viewer}
            />
            {settlement.note && (
              <p className="rounded-xl bg-cream px-4 py-3 text-[13px] text-ink-secondary">{settlement.note}</p>
            )}
          </div>
        )}
      </div>

      {remitOpen && (
        <RemitModal
          investmentId={investmentId}
          amount={sale.saleAmount}
          accounts={accounts}
          onClose={() => setRemitOpen(false)}
        />
      )}
    </section>
  );
}

/** Status message for the viewer: what happens next / why it was sent back. */
function Notice({ sale, viewer }: { sale: InvestmentSale; viewer: SaleViewer }) {
  const t = useTranslations("app.saleNotice");
  let tone: "info" | "danger" | "success" = "info";
  let text: string | null = null;

  switch (sale.status) {
    case "pending_review":
      text = viewer === "steward" ? t("stewardReview") : t("pendingReview");
      break;
    case "rejected":
      tone = "danger";
      text = `${t("rejected")} ${sale.rejectionReason ?? ""}`.trim();
      if (viewer === "farmer") text += ` ${t("rejectedFarmer")}`;
      break;
    case "awaiting_remittance":
      if (sale.remitRejectionReason) {
        tone = "danger";
        text = `${t("remitRejected")} ${sale.remitRejectionReason}`;
      } else {
        text = viewer === "farmer" ? t("farmerRemit") : t("awaitingRemittance");
      }
      break;
    case "remittance_submitted":
      text = viewer === "admin" ? t("adminReview") : t("remittanceSubmitted");
      break;
    case "settled":
      tone = "success";
      text = t("settled");
      break;
  }
  if (!text) return null;

  return (
    <p
      className={
        tone === "danger"
          ? "rounded-xl border border-[#F0C9C0] bg-[#FAF0ED] px-4 py-3 text-[13px] text-danger"
          : tone === "success"
            ? "rounded-xl border border-brand/30 bg-brand-tint px-4 py-3 text-[13px] text-green-deep"
            : "rounded-xl border border-[#C9DCEA] bg-[#EAF1F6] px-4 py-3 text-[13px] text-[#2F5D7C]"
      }
    >
      {text}
    </p>
  );
}
