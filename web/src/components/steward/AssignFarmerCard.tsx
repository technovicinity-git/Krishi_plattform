"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AssignFarmerCard({
  investment,
  farmers,
}: {
  investment: any;
  farmers: any[];
}) {
  const router = useRouter();
  const [selectedFarmer, setSelectedFarmer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planName = investment.offering?.investment_plans?.name_en || "Plan";
  const isAwaitingFarmer = investment.current_stage === "awaiting_farmer";

  const handleAssign = async () => {
    if (!selectedFarmer) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/steward/investments/${investment.id}/assign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ farmer_id: selectedFarmer }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border-light bg-white p-6">
      <div className="flex items-start justify-between border-b border-border-light pb-3">
        <div>
          <span className="font-mono text-[11px] font-bold text-ink-muted">
            {investment.reference}
          </span>
          <h3 className="mt-1 font-serif text-[20px] text-ink">{planName}</h3>
        </div>
        <span
          className={`inline-flex rounded px-2 py-1 text-[10px] font-bold uppercase ${
            isAwaitingFarmer
              ? "bg-[#FEF6E5] text-[#C48A2E]"
              : "bg-[#E8F0EA] text-green-deep"
          }`}
        >
          {investment.current_stage.replace(/_/g, " ")}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-[13px]">
        <div>
          <span className="text-ink-muted">Investor</span>
          <div className="font-semibold text-ink">
            {investment.investor?.full_name}
          </div>
        </div>
        <div>
          <span className="text-ink-muted">Units</span>
          <div className="font-bold text-ink">{investment.units} Units</div>
        </div>
      </div>

      {isAwaitingFarmer ? (
        <div className="mt-2 rounded-lg bg-stone/50 p-4">
          <label className="text-[12px] font-semibold text-ink">
            Assign Farmer
          </label>
          <div className="mt-2 flex gap-2">
            <select
              value={selectedFarmer}
              onChange={(e) => setSelectedFarmer(e.target.value)}
              className="h-[40px] flex-1 rounded border border-border-light bg-white px-2 text-[13px]"
            >
              <option value="">Select a farmer...</option>
              {farmers.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.full_name}
                </option>
              ))}
            </select>
            <button
              onClick={handleAssign}
              disabled={!selectedFarmer || loading}
              className="h-[40px] rounded bg-ink px-4 text-[12px] font-bold text-white disabled:opacity-50"
            >
              {loading ? "..." : "Assign"}
            </button>
          </div>
          {error && <p className="mt-2 text-[11px] text-[#A13D2B]">{error}</p>}
        </div>
      ) : (
        <>
          <div className="mt-2 rounded-lg bg-[#E8F0EA] p-4 text-[13px]">
            <span className="text-green-deep">Assigned to: </span>
            <span className="font-semibold text-ink">
              {investment.farmer?.full_name || "Unknown"}
            </span>
          </div>
          <Link
            href={`/steward/investments/${investment.id}`}
            className="inline-flex h-[40px] w-full items-center justify-center rounded bg-ink text-[13px] font-bold text-white hover:bg-[#2A2A2A]"
          >
            View Investment →
          </Link>
        </>
      )}
    </div>
  );
}