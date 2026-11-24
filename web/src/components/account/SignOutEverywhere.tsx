"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useDialog } from "@/components/ui/dialog-provider";
import { buttonClass } from "@/components/dashboard/ui";

/** Ends every session of this account, including this one, then goes to login. */
export function SignOutEverywhere({ loginPath = "/login" }: { loginPath?: string }) {
  const t = useTranslations("app.accountSettings");
  const dialog = useDialog();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    const ok = await dialog.confirm({
      title: t("signOutAllConfirmTitle"),
      message: t("signOutAllConfirmBody"),
      confirmLabel: t("signOutAll"),
      variant: "danger",
    });
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/logout-all", { method: "POST" });
      if (!res.ok) throw new Error();
      window.location.href = loginPath;
    } catch {
      setError(t("signOutAllFailed"));
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="max-w-[520px] text-[13px] text-ink-secondary">{t("signOutAllBody")}</p>
      <div className="flex flex-col gap-1.5 sm:items-end">
        <button
          type="button"
          onClick={run}
          disabled={busy}
          className={buttonClass("secondary", "border-danger/30 text-danger hover:bg-[#FBEDEA]")}
        >
          {busy ? t("signingOut") : t("signOutAll")}
        </button>
        {error && <span className="text-[12px] text-danger">{error}</span>}
      </div>
    </div>
  );
}
