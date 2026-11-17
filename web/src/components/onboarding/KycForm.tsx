"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { FormInput } from "@/components/auth/FormInput";
import { FormSelect } from "@/components/auth/FormSelect";
import { FileUpload } from "@/components/auth/FileUpload";
import { Heading } from "@/components/ui/Heading";
import { compressImage } from "@/lib/images/compress";

export function KycForm() {
  const t = useTranslations("onboarding.step2.form");
  const router = useRouter();

  const [docType, setDocType] = useState("nid");
  const [nidNumber, setNidNumber] = useState("");
  const [presentAddress, setPresentAddress] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");
  const [nidFront, setNidFront] = useState<File | null>(null);
  const [nidBack, setNidBack] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nidNumber.trim() || nidNumber.length < 10) {
      setError("Please enter a valid NID number");
      return;
    }
    if (!presentAddress.trim() || !permanentAddress.trim()) {
      setError("Please enter both addresses");
      return;
    }
    if (!nidFront || !nidBack) {
      setError("Both NID sides are required");
      return;
    }

    setSubmitting(true);

    try {
      const [front, back] = await Promise.all([
        compressImage(nidFront),
        compressImage(nidBack),
      ]);

      const formData = new FormData();
      formData.append("docType", docType);
      formData.append("nidNumber", nidNumber.trim());
      formData.append("presentAddress", presentAddress.trim());
      formData.append("permanentAddress", permanentAddress.trim());
      formData.append("nidFront", front);
      formData.append("nidBack", back);

      const res = await fetch("/api/kyc/submit", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Failed to submit KYC");
        setSubmitting(false);
        return;
      }

      router.push("/portal/profile?kyc=submitted");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-[560px] flex-col gap-7">
      <div className="flex flex-col gap-3">
        <Heading as="h2" size="subsection" className="lg:text-[32px]">
          {t("heading")}
        </Heading>
      </div>

      <div className="flex items-start gap-3 rounded-[8px] border border-[#F0D9A6] bg-[#FEF6E5] px-4 py-3">
        <p className="text-[13px] leading-[1.5] text-[#7A5C1E]">
          {t("banner")}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-[13px] font-bold uppercase tracking-[0.02em] text-terracotta">
          {t("section1Title")}
        </h3>

        <FormSelect
          label={t("docTypeLabel")}
          name="docType"
          value={docType}
          onChange={setDocType}
          required
          options={[{ value: "nid", label: t("docTypeNid") }]}
        />

        <FormInput
          label={t("nidLabel")}
          name="nidNumber"
          placeholder={t("nidPlaceholder")}
          value={nidNumber}
          onChange={setNidNumber}
          required
        />

        <FileUpload
          id="nidFront"
          label={t("uploadFront")}
          fileName={nidFront?.name}
          onFile={setNidFront}
        />
        <FileUpload
          id="nidBack"
          label={t("uploadBack")}
          fileName={nidBack?.name}
          onFile={setNidBack}
        />
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-[13px] font-bold uppercase tracking-[0.02em] text-terracotta">
          {t("section2Title")}
        </h3>

        <FormInput
          label={t("presentAddressLabel")}
          name="presentAddress"
          placeholder={t("presentAddressPlaceholder")}
          value={presentAddress}
          onChange={setPresentAddress}
          required
        />

        <FormInput
          label={t("permanentAddressLabel")}
          name="permanentAddress"
          placeholder={t("permanentAddressPlaceholder")}
          value={permanentAddress}
          onChange={setPermanentAddress}
          required
        />
      </div>

      {error && (
        <div className="rounded-[8px] border border-[#F0C9C0] bg-[#FAF0ED] px-4 py-3 text-[13px] text-[#A13D2B]">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-[52px] w-full items-center justify-center rounded-[8px] bg-terracotta text-[15px] font-bold text-white transition-colors hover:bg-[#B3634A] disabled:opacity-60"
      >
        {submitting ? t("submitting") : t("submit")}
      </button>

      <p className="text-center text-[11px] leading-tight text-ink-muted">
        {t("securityNote")}
      </p>
    </form>
  );
}