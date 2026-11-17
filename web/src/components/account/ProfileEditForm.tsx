"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDialog } from "@/components/ui/dialog-provider";

interface ProfileEditFormProps {
  initialFullName: string;
  initialEmail: string;
  phone: string;
}

export function ProfileEditForm({
  initialFullName,
  initialEmail,
  phone,
}: ProfileEditFormProps) {
  const router = useRouter();
  const { alert } = useDialog();
  const [fullName, setFullName] = useState(initialFullName);
  const [email, setEmail] = useState(initialEmail);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Failed to save");
        setSubmitting(false);
        return;
      }

      await alert({
        title: "Profile updated",
        variant: "success",
      });
      router.refresh();
      setSubmitting(false);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold text-ink-nav">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="h-[42px] w-full rounded-[8px] border border-border-light bg-cream px-3 text-[13px] text-ink focus:border-sage focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold text-ink-nav">Phone Number</label>
          <input
            type="text"
            value={phone}
            disabled
            className="h-[42px] w-full rounded-[8px] border border-border-light bg-stone px-3 text-[13px] text-ink-muted"
          />
          <p className="text-[11px] text-ink-muted">
            Phone number cannot be changed. Contact support if needed.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label className="text-[13px] font-semibold text-ink-nav">
            Email Address <span className="text-[11px] font-normal text-ink-muted">(optional)</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-[42px] w-full rounded-[8px] border border-border-light bg-cream px-3 text-[13px] text-ink placeholder:text-ink-muted focus:border-sage focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-[8px] border border-[#F0C9C0] bg-[#FAF0ED] px-4 py-3 text-[13px] text-[#A13D2B]">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-[42px] items-center justify-center rounded-[8px] bg-ink px-6 text-[13px] font-bold text-white hover:bg-[#2A2A2A] disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}