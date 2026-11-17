"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { compressImage } from "@/lib/images/compress";
import { createClient } from "@/lib/supabase/client";

export function DepositForm({ interestId, expectedAmount }: { interestId: string, expectedAmount: number }) {
  const router = useRouter();
  const supabase = createClient();

  const [method, setMethod] = useState<"bank" | "mfs">("mfs");
  const [txnId, setTxnId] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (method === "bank" && !txnId) return setError("Transaction ID is required.");
    if (method === "mfs" && !senderNumber) return setError("Sender number is required.");

    setLoading(true);
    setError(null);

    try {
      let proofPath = undefined;

      if (file) {
        const compressed = await compressImage(file, 1200, 0.8);
        const fileName = `${interestId}-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("deposit-proofs")
          .upload(fileName, compressed);

        if (uploadError) throw new Error(uploadError.message || "Failed to upload proof");
        proofPath = fileName;
      }

      const payload = {
        interest_id: interestId,
        amount: expectedAmount,
        method,
        txn_id: method === "bank" ? txnId : undefined,
        sender_number: method === "mfs" ? senderNumber : undefined,
        deposit_date: depositDate,
        note: note.trim() || undefined,
        proof_path: proofPath,
      };

      const res = await fetch("/api/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit");
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5 border-t border-border-light pt-6">
      <div>
        <label className="text-[13px] font-semibold text-ink-nav">Payment Method</label>
        <div className="mt-2 flex gap-6">
          <label className="flex items-center gap-2 text-[13px] cursor-pointer">
            <input type="radio" checked={method === "mfs"} onChange={() => setMethod("mfs")} className="accent-terracotta" />
            Mobile Wallet
          </label>
          <label className="flex items-center gap-2 text-[13px] cursor-pointer">
            <input type="radio" checked={method === "bank"} onChange={() => setMethod("bank")} className="accent-terracotta" />
            Bank Transfer
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="text-[13px] font-semibold text-ink-nav">Amount to Send (BDT)</label>
          <div className="mt-1 flex h-[44px] w-full items-center rounded-[8px] border border-border-light bg-stone px-3 text-[14px] font-bold text-ink">
            ৳{expectedAmount.toLocaleString("en-IN")}
          </div>
        </div>
        <div>
          <label className="text-[13px] font-semibold text-ink-nav">Deposit Date</label>
          <input
            type="date"
            value={depositDate}
            onChange={(e) => setDepositDate(e.target.value)}
            className="mt-1 h-[44px] w-full rounded-[8px] border border-border-light bg-cream px-3 text-[13px] focus:border-sage focus:outline-none"
          />
        </div>
      </div>

      {method === "mfs" ? (
        <div>
          <label className="text-[13px] font-semibold text-ink-nav">Sender Mobile Number</label>
          <input
            type="text"
            value={senderNumber}
            onChange={(e) => setSenderNumber(e.target.value)}
            placeholder="e.g. 01712345678"
            className="mt-1 h-[44px] w-full rounded-[8px] border border-border-light bg-cream px-3 text-[13px] focus:border-sage focus:outline-none"
          />
        </div>
      ) : (
        <div>
          <label className="text-[13px] font-semibold text-ink-nav">Transaction ID (TXN)</label>
          <input
            type="text"
            value={txnId}
            onChange={(e) => setTxnId(e.target.value)}
            placeholder="e.g. 9F2A1B3C"
            className="mt-1 h-[44px] w-full rounded-[8px] border border-border-light bg-cream px-3 text-[13px] focus:border-sage focus:outline-none"
          />
        </div>
      )}

      <div>
        <label className="text-[13px] font-semibold text-ink-nav">Additional Note (Optional)</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Any reference or note"
          className="mt-1 h-[44px] w-full rounded-[8px] border border-border-light bg-cream px-3 text-[13px] focus:border-sage focus:outline-none"
        />
      </div>

      <div>
        <label className="text-[13px] font-semibold text-ink-nav">Upload Payment Proof (Optional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mt-1 block w-full text-[13px] text-ink-secondary file:mr-4 file:rounded file:border-0 file:bg-stone file:px-4 file:py-2 file:text-[12px] file:font-semibold hover:file:bg-stone/80"
        />
      </div>

      {error && <p className="text-[12px] text-[#A13D2B]">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 h-[48px] rounded bg-ink text-[14px] font-bold text-white hover:bg-[#2A2A2A] disabled:opacity-60"
      >
        {loading ? "Submitting..." : "Submit Deposit for Review"}
      </button>
    </form>
  );
}