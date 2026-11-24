import { describe, expect, it } from "vitest";
import { kindsFor, ledgerCsv, parseLedgerFilters, type TxEntry } from "@/lib/transactions";

const entry = (over: Partial<TxEntry>): TxEntry => ({
  id: "x",
  at: "2026-11-19T08:00:00Z",
  kind: "deposit",
  direction: "in",
  amount: 1000,
  status: "completed",
  reference: "KR-PAY-000001",
  detail: null,
  investmentId: null,
  investmentRef: null,
  party: null,
  partyRole: null,
  adminHref: null,
  ...over,
});

describe("transactions", () => {
  it("reads filters from the URL and ignores unknown values", () => {
    expect(parseLedgerFilters({ type: "withdrawal", from: "2026-11-01", to: "2026-11-30", q: "KR-" })).toEqual({
      kinds: ["withdrawal"],
      from: "2026-11-01",
      to: "2026-11-30",
      search: "KR-",
    });
    expect(parseLedgerFilters({ type: "drop table", from: "yesterday" })).toEqual({
      kinds: undefined,
      from: undefined,
      to: undefined,
      search: undefined,
    });
  });

  it("offers each viewer only the kinds that can happen to them", () => {
    expect(kindsFor({ kind: "user", userId: "u", role: "steward" })).toEqual(["monthly_pay", "share", "adjustment", "withdrawal"]);
    expect(kindsFor({ kind: "user", userId: "u", role: "investor" })).toContain("refund");
    expect(kindsFor({ kind: "platform" })).toContain("platform_share");
  });

  it("writes money out as negative and quotes text with commas", () => {
    const csv = ledgerCsv(
      [entry({ kind: "withdrawal", direction: "out", amount: 500, detail: "bKash •••1234, paid" })],
      false,
    );
    const [head, row] = csv.trim().split("\n");
    expect(head).toBe("date,type,direction,amount,status,reference,batch,detail");
    expect(row).toBe('2026-11-19T08:00:00Z,withdrawal,out,-500,completed,KR-PAY-000001,,"bKash •••1234, paid"');
  });

  it("adds who the money belongs to for the admin", () => {
    const csv = ledgerCsv([entry({ party: "Rahim", partyRole: "investor" })], true);
    expect(csv.split("\n")[0]).toContain("party,role");
    expect(csv.split("\n")[1]).toContain("Rahim,investor");
  });
});
