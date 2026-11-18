"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useDialog } from "@/components/ui/dialog-provider";
import { FormInput } from "@/components/auth/FormInput";

export function CreateFarmerForm() {
  const t = useTranslations("app.createFarmer");
  const tc = useTranslations("app.common");
  const router = useRouter();
  const { alert } = useDialog();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [nidNumber, setNidNumber] = useState("");
  const [presentAddress, setPresentAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (nidNumber.trim().length < 10) {
      setError(t("invalidNid"));
      return;
    }
    if (presentAddress.trim().length < 5) {
      setError(t("invalidAddress"));
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/steward/farmers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          nidNumber,
          presentAddress,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? t("failed"));
        setSubmitting(false);
        return;
      }

      await alert({
        title: t("createdTitle"),
        message: t("createdMessage"),
        variant: "success",
      });

      router.push("/steward/farmers");
      router.refresh();
    } catch {
      setError(t("networkError"));
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 rounded-2xl border border-border-light bg-white p-8"
    >
      <div className="flex flex-col gap-3">
        <h2 className="font-serif text-[20px] leading-tight text-ink">
          {t("heading")}
        </h2>
        <p className="text-[13px] leading-[1.6] text-ink-secondary">
          {t("intro")}
        </p>
      </div>

      <div className="flex flex-col gap-5">
        <FormInput
          label={t("fullName")}
          name="fullName"
          value={fullName}
          onChange={setFullName}
          placeholder={t("fullNamePlaceholder")}
          required
          autoComplete="off"
        />
        <FormInput
          label={t("phone")}
          name="phone"
          type="tel"
          prefix="+880"
          value={phone}
          onChange={setPhone}
          placeholder="1XXX XXX XXX"
          helper={t("phoneHelper")}
          required
          autoComplete="off"
        />
        <FormInput
          label={t("nid")}
          name="nidNumber"
          value={nidNumber}
          onChange={setNidNumber}
          placeholder={t("nidPlaceholder")}
          required
          autoComplete="off"
        />
        <FormInput
          label={t("address")}
          name="presentAddress"
          value={presentAddress}
          onChange={setPresentAddress}
          placeholder={t("addressPlaceholder")}
          required
          autoComplete="off"
        />
      </div>

      {error && (
        <div className="rounded-[8px] border border-[#F0C9C0] bg-[#FAF0ED] px-4 py-3 text-[13px] text-[#A13D2B]">
          {error}
        </div>
      )}

      <div className="flex gap-3 border-t border-border-light pt-5">
        <button
          type="button"
          onClick={() => router.push("/steward/farmers")}
          disabled={submitting}
          className="inline-flex h-[46px] items-center justify-center rounded-[8px] border border-border-light bg-white px-6 text-[13px] font-semibold text-ink-nav hover:bg-stone disabled:opacity-60"
        >
          {tc("cancel")}
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-[46px] items-center justify-center rounded-[8px] bg-brand px-8 text-[13px] font-bold text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {submitting ? t("creating") : t("submit")}
        </button>
      </div>
    </form>
  );
}