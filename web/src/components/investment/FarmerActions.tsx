"use client";

import { useState } from "react";
import { FundRequestModal } from "./FundRequestModal";
import { LogExpenseModal } from "./LogExpenseModal";

export function FarmerActions({ investmentId }: { investmentId: string }) {
  const [showFund, setShowFund] = useState(false);
  const [showExpense, setShowExpense] = useState(false);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border-light bg-white p-6">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
        Available Actions
      </h2>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <button
          onClick={() => setShowFund(true)}
          className="rounded-lg bg-ink py-3 text-[13px] font-bold text-white hover:bg-[#2A2A2A]"
        >
          Request Funds
        </button>
        <button
          onClick={() => setShowExpense(true)}
          className="rounded-lg border border-border-light py-3 text-[13px] font-bold text-ink-nav hover:bg-stone"
        >
          Log Expense / Receipt
        </button>
      </div>

      {showFund && (
        <FundRequestModal
          investmentId={investmentId}
          onClose={() => setShowFund(false)}
        />
      )}
      {showExpense && (
        <LogExpenseModal
          investmentId={investmentId}
          onClose={() => setShowExpense(false)}
        />
      )}
    </div>
  );
}