"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { FormInput } from "@/components/auth/FormInput";
import { FormRadioCard } from "@/components/auth/FormRadioCard";
import { FormChipGroup } from "@/components/auth/FormChipGroup";
import { Heading } from "@/components/ui/Heading";
import type { WithdrawalPreference } from "@/lib/auth/current-user";

type Method = "mobile" | "bank";

interface WithdrawalFormProps {
  initial?: WithdrawalPreference | null;
  /** Where to go after saving (defaults to the investor profile). */
  redirectTo?: string;
}

export function WithdrawalForm({
  initial,
  redirectTo = "/portal/profile?withdrawal=saved",
}: WithdrawalFormProps) {
  const t = useTranslations("onboarding.step3.form");
  const tf = useTranslations("app.forms");
  const tcm = useTranslations("app.common");
  const router = useRouter();

  const [method, setMethod] = useState<Method>(initial?.method ?? "mobile");
  const [mfs, setMfs] = useState(initial?.mfsProvider ?? "bkash");
  const [mobile, setMobile] = useState(initial?.mobileNumber ?? "");
  const [holder, setHolder] = useState(initial?.accountHolderName ?? "");

  const [bankName, setBankName] = useState(initial?.bankName ?? "");
  const [bankAccount, setBankAccount] = useState(initial?.bankAccountNumber ?? "");
  const [bankBranch, setBankBranch] = useState(initial?.bankBranch ?? "");
  const [bankRouting, setBankRouting] = useState(initial?.bankRoutingNumber ?? "");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload =
      method === "mobile"
        ? {
            method: "mobile" as const,
            mfsProvider: mfs,
            mobileNumber: mobile,
            accountHolderName: holder,
          }
        : {
            method: "bank" as const,
            bankName,
            bankAccountNumber: bankAccount,
            bankBranch,
            bankRoutingNumber: bankRouting,
            accountHolderName: holder,
          };

    try {
      const res = await fetch("/api/onboarding/withdrawal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? tf("failedSave"));
        setSubmitting(false);
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setError(tcm("networkError"));
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-[560px] flex-col gap-7">
      <div className="flex flex-col gap-3">
        <Heading as="h2" size="subsection" className="lg:text-[32px]">
          {t("heading")}
        </Heading>
        <p className="text-[14px] leading-[1.6] text-ink-secondary">
          {t("subheading")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormRadioCard
          id="mobile"
          name="method"
          value="mobile"
          checked={method === "mobile"}
          onChange={() => setMethod("mobile")}
          title={t("mobileTitle")}
          description={t("mobileDescription")}
          badge={t("popular")}
        />
        <FormRadioCard
          id="bank"
          name="method"
          value="bank"
          checked={method === "bank"}
          onChange={() => setMethod("bank")}
          title={t("bankTitle")}
          description={t("bankDescription")}
        />
      </div>

      {method === "mobile" && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-[14px] font-semibold text-ink-nav">
              {t("mfsLabel")}
              <span className="ml-1 text-brand">*</span>
            </span>
            <FormChipGroup
              value={mfs}
              onChange={setMfs}
              options={[
                { value: "bkash", label: "bKash" },
                { value: "nagad", label: "Nagad" },
                { value: "rocket", label: "Rocket" },
              ]}
            />
          </div>

          <FormInput
            label={t("mobileLabel")}
            name="mobile"
            type="tel"
            placeholder={t("mobilePlaceholder")}
            value={mobile}
            onChange={setMobile}
            required
            helper={t("mobileHelper")}
          />

          <FormInput
            label={t("holderLabel")}
            name="holder"
            value={holder}
            onChange={setHolder}
            required
          />
        </div>
      )}

      {method === "bank" && (
        <div className="flex flex-col gap-5">
          <FormInput
            label={t("bankNameLabel")}
            name="bankName"
            placeholder={t("bankNamePlaceholder")}
            value={bankName}
            onChange={setBankName}
            required
          />
          <FormInput
            label={t("bankAccountLabel")}
            name="bankAccount"
            placeholder={t("bankAccountPlaceholder")}
            value={bankAccount}
            onChange={setBankAccount}
            required
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput
              label={t("bankBranchLabel")}
              name="bankBranch"
              placeholder={t("bankBranchPlaceholder")}
              value={bankBranch}
              onChange={setBankBranch}
              required
            />
            <FormInput
              label={t("bankRoutingLabel")}
              name="bankRouting"
              placeholder={t("bankRoutingPlaceholder")}
              value={bankRouting}
              onChange={setBankRouting}
              required
            />
          </div>
          <FormInput
            label={t("holderLabel")}
            name="holder"
            value={holder}
            onChange={setHolder}
            required
          />
        </div>
      )}

      {error && (
        <div className="rounded-[8px] border border-[#F0C9C0] bg-[#FAF0ED] px-4 py-3 text-[13px] text-[#A13D2B]">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-[52px] w-full items-center justify-center rounded-[8px] bg-brand text-[15px] font-bold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
      >
        {submitting ? t("submitting") : t("submit")}
      </button>

      <p className="text-center text-[11px] leading-tight text-ink-muted">
        {t("note")}
      </p>
    </form>
  );
}