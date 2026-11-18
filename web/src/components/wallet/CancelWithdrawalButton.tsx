"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useDialog } from "@/components/ui/dialog-provider";

export function CancelWithdrawalButton({ id, reference }: { id: string; reference: string }) {
  const t = useTranslations("app.wallet");
  const tc = useTranslations("app.common");
  const router = useRouter();
  const { confirm, alert } = useDialog();
  const [busy, setBusy] = useState(false);

  const cancel = async () => {
    const ok = await confirm({
      title: t("cancelTitle", { reference }),
      message: t("cancelMessage"),
      confirmLabel: t("cancelWithdrawal"),
      cancelLabel: tc("back"),
      variant: "danger",
    });
    if (!ok) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/wallet/withdrawals/${id}/cancel`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("cancelFailed"));
      router.refresh();
    } catch (err) {
      await alert({
        title: t("cancelFailed"),
        message: err instanceof Error ? err.message : undefined,
        variant: "danger",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={cancel}
      disabled={busy}
      className="text-[12px] font-semibold text-danger hover:underline disabled:opacity-50"
    >
      {busy ? "..." : t("cancelWithdrawal")}
    </button>
  );
}
