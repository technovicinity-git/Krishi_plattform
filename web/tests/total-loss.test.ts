import { describe, expect, it } from "vitest";
import { totalLossBlocker } from "@/lib/investments/total-loss";
import { computeSettlement } from "@/lib/investments/settlement";

const base = { stage: "growing_care", animalStatuses: ["dead", "dead"], pendingFundRequests: 0, saleStatus: null };

describe("totalLossBlocker", () => {
  it("allows closing when every animal is dead", () => {
    expect(totalLossBlocker(base)).toBeNull();
    expect(totalLossBlocker({ ...base, saleStatus: "rejected" })).toBeNull();
  });
  it("blocks while any animal is alive or a death report is pending", () => {
    expect(totalLossBlocker({ ...base, animalStatuses: ["dead", "active"] })).toBe("animals_alive");
    expect(totalLossBlocker({ ...base, animalStatuses: ["dead", "sold"] })).toBe("animals_alive");
    expect(totalLossBlocker({ ...base, animalStatuses: ["dead", "death_reported"] })).toBe("death_pending");
  });
  it("blocks on pending fund requests, wrong stage, no animals, or an open sale", () => {
    expect(totalLossBlocker({ ...base, pendingFundRequests: 1 })).toBe("fund_requests");
    expect(totalLossBlocker({ ...base, stage: "sale_pending" })).toBe("not_growing");
    expect(totalLossBlocker({ ...base, animalStatuses: [] })).toBe("no_animals");
    expect(totalLossBlocker({ ...base, saleStatus: "remittance_submitted" })).toBe("sale_exists");
  });
});

describe("total-loss settlement", () => {
  it("returns only the unspent capital, with no shares", () => {
    const b = computeSettlement({ capital: 100000, fundsReleased: 60000, saleAmount: 0 });
    expect(b).toMatchObject({ outcome: "loss", investorPayout: 40000, netResult: -60000, farmerShare: 0, stewardShare: 0, platformShare: 0 });
  });
  it("pays nothing when all capital was spent", () => {
    const b = computeSettlement({ capital: 100000, fundsReleased: 100000, saleAmount: 0 });
    expect(b).toMatchObject({ outcome: "loss", investorPayout: 0, netResult: -100000 });
  });
});
