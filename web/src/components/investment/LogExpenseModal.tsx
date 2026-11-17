"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { compressImage } from "@/lib/images/compress";
import { createClient } from "@/lib/supabase/client";

export function LogExpenseModal({ investmentId, onClose }: { investmentId: string, onClose: () => void }) {
  const router = useRouter();
  const supabase = createClient();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("feed");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let receiptPath = null;

      if (file) {
        const compressed = await compressImage(file, 1200, 0.8);
        const fileName = `exp-${investmentId}-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage.from("deposit-proofs").upload(fileName, compressed);
        if (uploadError) throw new Error("Failed to upload receipt");
        receiptPath = fileName;
      }

      const res = await fetch("/api/farmer/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investment_id: investmentId,
          amount: Number(amount),
          category,
          description,
          receipt_path: receiptPath,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to log expense");
      
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
        <h2 className="font-serif text-[22px] text-ink">Log Expense</h2>
        <p className="mt-1 text-[12px] text-ink-muted">Record money spent from your approved funds.</p>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div>
            <label className="text-[12px] font-semibold text-ink-nav">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 h-[40px] w-full rounded border border-border-light bg-cream px-3 text-[13px]">
              <option value="animal_purchase">Animal Purchase</option>
              <option value="feed">Feed</option>
              <option value="medical">Medical / Veterinary</option>
              <option value="transport">Transport</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-ink-nav">Amount Spent (BDT)</label>
            <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 h-[40px] w-full rounded border border-border-light bg-cream px-3 text-[13px]" />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-ink-nav">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was bought?" className="mt-1 h-[40px] w-full rounded border border-border-light bg-cream px-3 text-[13px]" />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-ink-nav">Upload Receipt (Optional)</label>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-[13px] text-ink-secondary file:mr-2 file:rounded file:border-0 file:bg-stone file:px-3 file:py-1.5 file:text-[11px] file:font-semibold" />
          </div>

          {error && <p className="text-[12px] text-[#A13D2B]">{error}</p>}

          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 rounded border border-border-light py-2 text-[13px] font-semibold text-ink-secondary">Cancel</button>
            <button type="submit" disabled={loading || !amount} className="flex-1 rounded bg-ink py-2 text-[13px] font-bold text-white disabled:opacity-50">
              {loading ? "Saving..." : "Submit Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}