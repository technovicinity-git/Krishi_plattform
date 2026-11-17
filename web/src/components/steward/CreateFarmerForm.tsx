"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useDialog } from "@/components/ui/dialog-provider";
import { FormInput } from "@/components/auth/FormInput";

export function CreateFarmerForm() {
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
      setError("Please enter a valid NID number (10–17 digits).");
      return;
    }
    if (presentAddress.trim().length < 5) {
      setError("Please enter a valid present address.");
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
        setError(data.error ?? "Failed to create farmer account");
        setSubmitting(false);
        return;
      }

      await alert({
        title: "Farmer account created",
        message:
          "An activation SMS will be sent to the farmer's phone. They will set their own password when they first log in.",
        variant: "success",
      });

      router.push("/steward/farmers");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
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
          Farmer details
        </h2>
        <p className="text-[13px] leading-[1.6] text-ink-secondary">
          The farmer will receive an SMS with activation instructions. They
          will set their own password on first login.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        <FormInput
          label="Full Name (as per NID)"
          name="fullName"
          value={fullName}
          onChange={setFullName}
          placeholder="e.g. Abdul Karim"
          required
          autoComplete="off"
        />
        <FormInput
          label="Phone Number"
          name="phone"
          type="tel"
          prefix="+880"
          value={phone}
          onChange={setPhone}
          placeholder="1XXX XXX XXX"
          helper="Enter the 10-digit number without the leading 0."
          required
          autoComplete="off"
        />
        <FormInput
          label="NID Number"
          name="nidNumber"
          value={nidNumber}
          onChange={setNidNumber}
          placeholder="10–17 digits"
          required
          autoComplete="off"
        />
        <FormInput
          label="Present Address"
          name="presentAddress"
          value={presentAddress}
          onChange={setPresentAddress}
          placeholder="Village, Post Office, Upazila, District"
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
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-[46px] items-center justify-center rounded-[8px] bg-ink px-8 text-[13px] font-bold text-white hover:bg-[#2A2A2A] disabled:opacity-60"
        >
          {submitting ? "Creating..." : "Create Farmer Account"}
        </button>
      </div>
    </form>
  );
}