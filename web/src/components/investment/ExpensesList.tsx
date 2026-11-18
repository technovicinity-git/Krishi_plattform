"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { formatBDT } from "@/lib/utils";
import { useDialog } from "@/components/ui/dialog-provider";
import { StatusBadge, toneFor } from "@/components/dashboard/ui";
import { Link } from "@/i18n/navigation";
import type { InvestmentDetail } from "@/lib/investments/detail";

type Expense = InvestmentDetail["expenses"][number] & {
  /** Set on cross-batch lists: which batch the expense belongs to. */
  batch?: { href: string; reference: string; label: string };
};

/** Expenses on a batch. Stewards can approve or reject pending ones. */
export function ExpensesList({
  expenses,
  isSteward = false,
  title,
  bare = false,
}: {
  expenses: Expense[];
  isSteward?: boolean;
  title?: string;
  /** Hide the heading bar (when the page already has one). */
  bare?: boolean;
}) {
  const t = useTranslations("app.expenseList");
  const tp = useTranslations("app.purpose");
  const ts = useTranslations("app.status");
  const tc = useTranslations("app.common");
  const locale = useLocale();
  const router = useRouter();
  const { alert } = useDialog();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const approvedTotal = expenses
    .filter((e) => e.status === "approved")
    .reduce((sum, e) => sum + e.amount, 0);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    if (action === "reject" && !reason.trim()) return;
    setLoadingId(id);
    try {
      const res = await fetch(`/api/steward/expenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("actionFailed"));
      setRejectId(null);
      setReason("");
      router.refresh();
    } catch (err) {
      await alert({
        title: t("actionFailed"),
        message: err instanceof Error ? err.message : undefined,
        variant: "danger",
      });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <section className="rounded-2xl border border-border-light bg-white">
      {!bare && (
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-light px-6 py-4">
        <h2 className="text-[15px] font-semibold text-ink">{title ?? t("heading")}</h2>
        {expenses.length > 0 && (
          <span className="text-[12px] text-ink-muted">
            {t("approvedTotal")}{" "}
            <strong className="text-green-deep">{formatBDT(approvedTotal)}</strong>
          </span>
        )}
      </div>
      )}
      {expenses.length === 0 ? (
        <p className="px-6 py-6 text-[13px] text-ink-muted">{t("empty")}</p>
      ) : (
        <ul className="divide-y divide-border-light">
          {expenses.map((e) => {
            const receipt = e.receiptUrl;
            return (
              <li key={e.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-semibold text-ink">
                      {tp.has(e.category) ? tp(e.category) : e.category.replace(/_/g, " ")}
                    </span>
                    <StatusBadge tone={toneFor(e.status)}>
                      {ts.has(e.status) ? ts(e.status) : e.status}
                    </StatusBadge>
                  </div>
                  {e.batch && (
                    <Link href={e.batch.href} className="text-[12px] font-semibold text-brand hover:underline">
                      {e.batch.label} · <span className="font-mono">{e.batch.reference}</span>
                    </Link>
                  )}
                  {e.description && (
                    <span className="text-[12.5px] text-ink-secondary">{e.description}</span>
                  )}
                  <span className="text-[11px] text-ink-muted">
                    {new Date(e.createdAt).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                    {receipt && (
                      <>
                        {" · "}
                        <a href={receipt} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand hover:underline">
                          {t("receipt")}
                        </a>
                      </>
                    )}
                  </span>
                  {e.status === "rejected" && e.rejectionReason && (
                    <span className="text-[12px] text-danger">{e.rejectionReason}</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <span className="text-[16px] font-bold text-ink">{formatBDT(e.amount)}</span>
                  {isSteward && e.status === "pending" &&
                    (rejectId === e.id ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <input
                          type="text"
                          placeholder={t("reason")}
                          value={reason}
                          onChange={(ev) => setReason(ev.target.value)}
                          className="h-[34px] w-[180px] rounded-[6px] border border-[#F0C9C0] px-2.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-danger/20"
                        />
                        <button
                          onClick={() => handleAction(e.id, "reject")}
                          disabled={loadingId === e.id || !reason.trim()}
                          className="h-[34px] rounded-[6px] bg-danger px-3 text-[12px] font-bold text-white disabled:opacity-50"
                        >
                          {tc("confirm")}
                        </button>
                        <button
                          onClick={() => setRejectId(null)}
                          className="h-[34px] rounded-[6px] border border-border-light px-3 text-[12px] font-semibold text-ink-secondary"
                        >
                          {tc("cancel")}
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setRejectId(e.id)}
                          disabled={loadingId === e.id}
                          className="h-[34px] rounded-[6px] border border-border-light px-3 text-[12px] font-semibold text-ink-secondary hover:bg-stone disabled:opacity-50"
                        >
                          {tc("reject")}
                        </button>
                        <button
                          onClick={() => handleAction(e.id, "approve")}
                          disabled={loadingId === e.id}
                          className="h-[34px] rounded-[6px] bg-brand px-3 text-[12px] font-bold text-white hover:bg-brand-hover disabled:opacity-50"
                        >
                          {loadingId === e.id ? "..." : tc("approve")}
                        </button>
                      </div>
                    ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
