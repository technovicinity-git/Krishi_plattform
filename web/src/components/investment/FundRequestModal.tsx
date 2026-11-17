"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FundRequestModal({ investmentId, onClose }: { investmentId: string, onClose: () => void }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("animal_purchase");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/farmer/fund-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investment_id: investmentId,
          amount: Number(amount),
          purpose,
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      
      onClose();
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="font-serif text-[22px] text-ink">Request Funds</h2>
        <p className="mt-1 text-[12px] text-ink-muted">Ask your steward for funds to cover investment expenses.</p>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div>
            <label className="text-[12px] font-semibold text-ink-nav">Purpose</label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="mt-1 h-[40px] w-full rounded border border-border-light bg-cream px-3 text-[13px]"
            >
              <option value="animal_purchase">Animal Purchase</option>
              <option value="feed">Feed</option>
              <option value="medical">Medical / Veterinary</option>
              <option value="transport">Transport</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-ink-nav">Amount (BDT)</label>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 h-[40px] w-full rounded border border-border-light bg-cream px-3 text-[13px]"
            />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-ink-nav">Note (Optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded border border-border-light bg-cream px-3 py-2 text-[13px]"
            />
          </div>

          {error && <p className="text-[12px] text-[#A13D2B]">{error}</p>}

          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 rounded border border-border-light py-2 text-[13px] font-semibold text-ink-secondary">Cancel</button>
            <button type="submit" disabled={loading || !amount} className="flex-1 rounded bg-terracotta py-2 text-[13px] font-bold text-white disabled:opacity-50">
              {loading ? "Sending..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}