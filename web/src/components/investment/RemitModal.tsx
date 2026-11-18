"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { compressImage } from "@/lib/images/compress";
import { formatBDT } from "@/lib/utils";
import {
  FieldLabel,
  FormError,
  Modal,
  ModalActions,
  fieldClass,
} from "@/components/dashboard/Modal";
import { PhotoField } from "./PhotoField";

export interface PlatformAccount {
  id: string;
  method: string;
  provider: string | null;
  accountName: string | null;
  accountNumber: string | null;
  branchName: string | null;
}

/** Farmer reports sending the sale money to one of Krishi's accounts. */
export function RemitModal({
  investmentId,
  amount,
  accounts,
  onClose,
}: {
  investmentId: string;
  amount: number;
  accounts: PlatformAccount[];
  onClose: () => void;
}) {
  const t = useTranslations("app.remitForm");
  const tc = useTranslations("app.common");
  const router = useRouter();
  const ids = { method: useId(), txn: useId(), sender: useId(), note: useId() };
  const [method, setMethod] = useState<"mfs" | "bank" | "cash">("mfs");
  const [txn, setTxn] = useState("");
  const [sender, setSender] = useState("");
  const [note, setNote] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cash = method === "cash";
  const shown = accounts.filter((a) => (method === "bank" ? a.method === "bank" : a.method !== "bank"));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("method", method);
      fd.set("txn_id", cash ? "" : txn);
      fd.set("sender", sender);
      fd.set("note", note);
      if (proof) fd.set("proof", await compressImage(proof, 1600, 1));

      const res = await fetch(`/api/farmer/investments/${investmentId}/remit`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("failed"));
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failed"));
      setLoading(false);
    }
  };

  return (
    <Modal title={t("title")} subtitle={t("subtitle", { amount: formatBDT(amount) })} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <FieldLabel htmlFor={ids.method}>{t("method")}</FieldLabel>
          <select
            id={ids.method}
            value={method}
            onChange={(e) => setMethod(e.target.value as typeof method)}
            className={`${fieldClass} h-[44px]`}
          >
            <option value="mfs">{t("methodMfs")}</option>
            <option value="bank">{t("methodBank")}</option>
            <option value="cash">{t("methodCash")}</option>
          </select>
        </div>

        {cash ? (
          <p className="rounded-xl bg-cream px-4 py-3 text-[12.5px] leading-[1.55] text-ink-secondary">
            {t("cashHint")}
          </p>
        ) : shown.length > 0 ? (
          <div className="flex flex-col gap-2">
            <span className="text-[12.5px] font-semibold text-ink-nav">{t("sendTo")}</span>
            {shown.map((a) => (
              <div key={a.id} className="rounded-xl border border-brand/30 bg-brand-tint/50 px-4 py-3 text-[13px]">
                <div className="font-bold uppercase text-green-deep">{a.provider ?? a.method}</div>
                <div className="font-mono text-[15px] font-semibold text-ink">{a.accountNumber ?? "—"}</div>
                <div className="text-[12px] text-ink-secondary">
                  {a.accountName}
                  {a.branchName ? ` · ${a.branchName}` : ""}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-cream px-4 py-3 text-[12.5px] text-ink-secondary">{t("noAccounts")}</p>
        )}

        {!cash && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor={ids.txn}>{t("txnId")}</FieldLabel>
              <input
                id={ids.txn}
                type="text"
                required
                value={txn}
                onChange={(e) => setTxn(e.target.value)}
                className={`${fieldClass} h-[44px]`}
              />
            </div>
            <div>
              <FieldLabel htmlFor={ids.sender}>{t("sender")}</FieldLabel>
              <input
                id={ids.sender}
                type="text"
                value={sender}
                placeholder={method === "bank" ? t("senderBankPlaceholder") : t("senderMfsPlaceholder")}
                onChange={(e) => setSender(e.target.value)}
                className={`${fieldClass} h-[44px]`}
              />
            </div>
          </div>
        )}

        <div>
          <FieldLabel htmlFor={ids.note}>{t("note")}</FieldLabel>
          <textarea
            id={ids.note}
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={`${fieldClass} py-2.5`}
          />
        </div>
        <PhotoField label={cash ? t("proofOptional") : t("proof")} file={proof} onChange={setProof} />
        <FormError>{error}</FormError>
        <ModalActions
          onCancel={onClose}
          cancelLabel={tc("cancel")}
          submitLabel={loading ? t("submitting") : t("submit")}
          disabled={loading || (!cash && (!txn || !proof))}
        />
      </form>
    </Modal>
  );
}
