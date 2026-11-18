"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { NavIcon, type NavIconName } from "@/components/dashboard/NavIcon";
import { FundRequestModal } from "./FundRequestModal";
import { LogExpenseModal } from "./LogExpenseModal";
import { PurchaseModal } from "./PurchaseModal";
import { PostUpdateModal } from "./PostUpdateModal";
import { RecordSaleModal } from "./RecordSaleModal";

type Dialog = "purchase" | "sale" | "update" | "fund" | "expense" | null;

interface Action {
  key: Exclude<Dialog, null>;
  icon: NavIconName;
  label: string;
  hint: string;
  primary?: boolean;
}

/** Stage-aware actions a farmer can take on an assigned batch. */
export function FarmerActions({
  investmentId,
  currentStage,
  units,
  saleRejected = false,
}: {
  investmentId: string;
  currentStage: string;
  units: number;
  /** The steward sent the last recorded sale back; offer to record it again. */
  saleRejected?: boolean;
}) {
  const t = useTranslations("app.farmerActions");
  const t2 = useTranslations("app.farmerActions2");
  const [open, setOpen] = useState<Dialog>(null);
  const close = () => setOpen(null);

  const needsPurchase = currentStage === "awaiting_purchase";
  const raising = currentStage === "growing_care";
  // Money can be requested/logged only while buying or raising the animals.
  const spending = needsPurchase || raising;
  // After settlement the batch is closed.
  if (currentStage === "settled") return null;

  const actions: Action[] = [
    ...(needsPurchase
      ? [{ key: "purchase", icon: "leaf", label: t2("confirmPurchase"), hint: t2("confirmPurchaseHint"), primary: true } as Action]
      : []),
    ...(raising
      ? [{
          key: "sale",
          icon: "tag",
          label: saleRejected ? t2("recordSaleAgain") : t2("recordSale"),
          hint: t2("recordSaleHint"),
          primary: true,
        } as Action]
      : []),
    { key: "update", icon: "clipboard", label: t2("postUpdate"), hint: t2("postUpdateHint"), primary: !spending },
    ...(spending
      ? ([
          { key: "fund", icon: "coins", label: t("requestFunds"), hint: t2("requestFundsHint") },
          { key: "expense", icon: "receipt", label: t("logExpense"), hint: t2("logExpenseHint") },
        ] as Action[])
      : []),
  ];

  return (
    <section className="rounded-2xl border border-border-light bg-white">
      <div className="border-b border-border-light px-6 py-4">
        <h2 className="text-[15px] font-semibold text-ink">{t("heading")}</h2>
      </div>
      <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2">
        {actions.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => setOpen(a.key)}
            className={cn(
              "group flex items-start gap-3 rounded-xl border p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
              a.primary
                ? "border-brand bg-brand text-white hover:bg-brand-hover"
                : "border-border-light bg-white hover:border-brand/50 hover:bg-brand-tint/50",
            )}
          >
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                a.primary ? "bg-white/15 text-white" : "bg-brand-tint text-brand",
              )}
            >
              <NavIcon name={a.icon} />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className={cn("text-[14px] font-bold", a.primary ? "text-white" : "text-ink")}>
                {a.label}
              </span>
              <span className={cn("text-[12px] leading-[1.45]", a.primary ? "text-white/80" : "text-ink-secondary")}>
                {a.hint}
              </span>
            </span>
          </button>
        ))}
      </div>

      {open === "purchase" && (
        <PurchaseModal investmentId={investmentId} defaultAnimals={units} onClose={close} />
      )}
      {open === "sale" && (
        <RecordSaleModal investmentId={investmentId} defaultAnimals={units} onClose={close} />
      )}
      {open === "update" && <PostUpdateModal investmentId={investmentId} onClose={close} />}
      {open === "fund" && <FundRequestModal investmentId={investmentId} onClose={close} />}
      {open === "expense" && <LogExpenseModal investmentId={investmentId} onClose={close} />}
    </section>
  );
}
