"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { formatBDT } from "@/lib/utils";
import { buttonClass } from "@/components/dashboard/ui";
import type { Animal } from "@/lib/animals";
import { RecordSaleModal } from "./RecordSaleModal";
import { RemitModal, type PlatformAccount } from "./RemitModal";

/** "Record sale" button for a batch that is ready to sell. */
export function RecordSaleButton({
  investmentId,
  units,
  animals,
  again = false,
}: {
  investmentId: string;
  units: number;
  animals: Pick<Animal, "id" | "tag" | "earTag" | "currentWeightKg">[];
  again?: boolean;
}) {
  const t = useTranslations("app.farmerActions2");
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClass("primary")}>
        {again ? t("recordSaleAgain") : t("recordSale")}
      </button>
      {open && (
        <RecordSaleModal
          investmentId={investmentId}
          defaultAnimals={units}
          animals={animals}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

/** "Send money to Krishi" button for a confirmed sale. */
export function SendMoneyButton({
  investmentId,
  amount,
  accounts,
}: {
  investmentId: string;
  amount: number;
  accounts: PlatformAccount[];
}) {
  const t = useTranslations("app.sale");
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClass("primary")}>
        {t("sendMoney", { amount: formatBDT(amount) })}
      </button>
      {open && (
        <RemitModal investmentId={investmentId} amount={amount} accounts={accounts} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
