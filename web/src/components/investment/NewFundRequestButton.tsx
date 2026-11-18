"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { buttonClass } from "@/components/dashboard/ui";
import { Modal } from "@/components/dashboard/Modal";
import { formatBDT } from "@/lib/utils";
import { FundRequestModal } from "./FundRequestModal";

export interface RequestableBatch {
  id: string;
  reference: string;
  plan: string;
  /** Money still available to request (investment amount minus open/approved requests). */
  remaining: number;
}

/**
 * "New request" on the farmer's Fund Requests page. With one batch it opens
 * the request form straight away; with several it asks which batch first.
 */
export function NewFundRequestButton({ batches }: { batches: RequestableBatch[] }) {
  const t = useTranslations("app.farmerFundRequests");
  const tc = useTranslations("app.common");
  const [choosing, setChoosing] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);

  if (batches.length === 0) return null;

  const start = () => {
    if (batches.length === 1) setBatchId(batches[0].id);
    else setChoosing(true);
  };

  return (
    <>
      <button type="button" onClick={start} className={buttonClass("primary")}>
        {t("newRequest")}
      </button>

      {choosing && (
        <Modal title={t("chooseBatch")} subtitle={t("chooseBatchHint")} onClose={() => setChoosing(false)}>
          <ul className="flex flex-col gap-2">
            {batches.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  disabled={b.remaining <= 0}
                  onClick={() => {
                    setChoosing(false);
                    setBatchId(b.id);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-border-light px-4 py-3 text-left transition-colors hover:border-brand/50 hover:bg-brand-tint/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-[14px] font-semibold text-ink">{b.plan}</span>
                    <span className="font-mono text-[11px] text-ink-muted">{b.reference}</span>
                  </span>
                  <span className="shrink-0 text-right text-[12px] text-ink-secondary">
                    {t("remaining")}
                    <br />
                    <strong className="text-[13px] text-green-deep">{formatBDT(b.remaining)}</strong>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setChoosing(false)}
            className="mt-4 h-[40px] w-full rounded-[8px] border border-border-light text-[13px] font-semibold text-ink-secondary hover:bg-stone"
          >
            {tc("cancel")}
          </button>
        </Modal>
      )}

      {batchId && <FundRequestModal investmentId={batchId} onClose={() => setBatchId(null)} />}
    </>
  );
}
