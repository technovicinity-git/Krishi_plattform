"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDialog } from "@/components/ui/dialog-provider";

interface FarmerActivationPanelProps {
  farmerId: string;
  phone: string;
  devOtp: string | null;
}

export function FarmerActivationPanel({
  farmerId,
  phone,
  devOtp,
}: FarmerActivationPanelProps) {
  const router = useRouter();
  const { alert } = useDialog();
  const [resending, setResending] = useState(false);

  const activationUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/farmer/activate?phone=${encodeURIComponent(phone)}`
      : `/farmer/activate?phone=${encodeURIComponent(phone)}`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(activationUrl);
      await alert({
        title: "Activation link copied",
        message:
          "Share this link with the farmer. They will need it to activate their account along with the activation code.",
        variant: "success",
      });
    } catch {
      await alert({
        title: "Could not copy",
        message: activationUrl,
        variant: "info",
      });
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await fetch(
        `/api/steward/farmers/${farmerId}/resend-activation`,
        { method: "POST" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await alert({
          title: "Could not resend",
          message: data.error ?? "Please try again.",
          variant: "danger",
        });
        setResending(false);
        return;
      }
      await alert({
        title: "Activation code regenerated",
        message: devOtp
          ? "A new code has been generated. The old code no longer works."
          : "A new code has been sent to the farmer's phone.",
        variant: "success",
      });
      router.refresh();
      setResending(false);
    } catch {
      await alert({ title: "Network error", variant: "danger" });
      setResending(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-[#F0D9A6] bg-[#FEF6E5] p-6">
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-bold text-[#7A5C1E]">
          Activation pending
        </span>
        <p className="text-[12px] leading-[1.6] text-[#7A5C1E]">
          The farmer must activate their account before they can log in. Share
          the activation link and code below. They will set their own password
          during activation.
        </p>
      </div>

      {devOtp && (
        <div className="rounded-[8px] border border-dashed border-brand bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="rounded-[3px] bg-brand px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.02em] text-white">
              Dev Mode
            </span>
            <span className="text-[11px] text-ink-secondary">
              SMS not sent — share this code with the farmer
            </span>
          </div>
          <div className="mt-1.5 text-[24px] font-bold tracking-[0.15em] text-brand">
            {devOtp}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.02em] text-[#7A5C1E]">
          Activation link
        </span>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded-[6px] border border-border-light bg-white px-3 py-2.5 text-[11px] text-ink-secondary">
            {activationUrl}
          </code>
          <button
            type="button"
            onClick={handleCopyUrl}
            className="inline-flex h-[38px] shrink-0 items-center justify-center rounded-[6px] bg-white px-4 text-[12px] font-semibold text-ink-nav transition-colors hover:bg-stone"
          >
            Copy
          </button>
        </div>
      </div>

      <div className="border-t border-[#F0D9A6] pt-4">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="inline-flex h-[42px] items-center justify-center rounded-[8px] bg-ink px-5 text-[13px] font-bold text-white transition-colors hover:bg-[#2A2A2A] disabled:opacity-60"
        >
          {resending ? "Regenerating..." : "Regenerate Activation Code"}
        </button>
      </div>
    </div>
  );
}