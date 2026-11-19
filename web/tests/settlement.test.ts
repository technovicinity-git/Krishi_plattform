import { describe, expect, it } from "vitest";
import { capitalSpent, computeSettlement, PROFIT_SPLIT, releasedFunds } from "@/lib/investments/settlement";

describe("computeSettlement", () => {
  it("splits a profit 60/30/5/5 and returns the investor's capital", () => {
    // Capital 1,50,000; 1,20,000 released; sold for 1,80,000.
    const b = computeSettlement({ capital: 150000, fundsReleased: 120000, saleAmount: 180000 });
    expect(b.unspent).toBe(30000);
    expect(b.totalReturn).toBe(210000);
    expect(b.netResult).toBe(60000);
    expect(b.outcome).toBe("profit");
    expect(b.farmerShare).toBe(36000);
    expect(b.investorProfit).toBe(18000);
    expect(b.stewardShare).toBe(3000);
    expect(b.platformShare).toBe(3000);
    expect(b.investorPayout).toBe(168000);
  });

  it("pays out exactly the total return (no money lost or invented)", () => {
    const cases = [
      { capital: 150000, fundsReleased: 120000, saleAmount: 180000 },
      { capital: 100000, fundsReleased: 99999.99, saleAmount: 133333.33 },
      { capital: 77777, fundsReleased: 12345.67, saleAmount: 98765.43 },
      { capital: 150000, fundsReleased: 140000, saleAmount: 100000 },
    ];
    for (const c of cases) {
      const b = computeSettlement(c);
      const paid = b.investorPayout + b.farmerShare + b.stewardShare + b.platformShare;
      expect(Math.round(paid * 100)).toBe(Math.round(b.totalReturn * 100));
    }
  });

  it("gives everything back to the investor on a loss, with no shares", () => {
    const b = computeSettlement({ capital: 150000, fundsReleased: 140000, saleAmount: 100000 });
    expect(b.outcome).toBe("loss");
    expect(b.netResult).toBe(-40000);
    expect(b.investorPayout).toBe(110000); // 1,00,000 sale + 10,000 unspent
    expect(b.farmerShare + b.stewardShare + b.platformShare).toBe(0);
  });

  it("treats exactly breaking even as no profit", () => {
    const b = computeSettlement({ capital: 150000, fundsReleased: 150000, saleAmount: 150000 });
    expect(b.outcome).toBe("break_even");
    expect(b.investorPayout).toBe(150000);
    expect(b.farmerShare).toBe(0);
  });

  it("never counts more than the capital as unspent", () => {
    const b = computeSettlement({ capital: 100000, fundsReleased: 120000, saleAmount: 150000 });
    expect(b.unspent).toBe(0);
    expect(b.netResult).toBe(50000);
  });

  it("uses shares that add up to 100%", () => {
    const total = Object.values(PROFIT_SPLIT).reduce((s, v) => s + v, 0);
    expect(total).toBe(100);
  });
});

describe("releasedFunds", () => {
  it("counts only approved and disbursed fund requests", () => {
    expect(
      releasedFunds([
        { status: "approved", amount: 50000 },
        { status: "disbursed", amount: 20000 },
        { status: "pending", amount: 99999 },
        { status: "rejected", amount: 99999 },
      ]),
    ).toBe(70000);
  });
});

describe("capitalSpent", () => {
  it("counts the animal purchase, not just fund requests (KR-INV-000012 case)", () => {
    // Invested 10,00,000; animals bought for 8,00,000; 2,00,000 feed request; sold for 6,00,000.
    const spent = capitalSpent({
      purchaseCost: 800000,
      requests: [{ status: "approved", amount: 200000, purpose: "feed" }],
    });
    expect(spent.spent).toBe(1000000);

    const b = computeSettlement({ capital: 1000000, fundsReleased: spent.spent, saleAmount: 600000 });
    expect(b.unspent).toBe(0);
    expect(b.totalReturn).toBe(600000);
    expect(b.netResult).toBe(-400000);
    expect(b.outcome).toBe("loss");
    expect(b.investorPayout).toBe(600000);
    expect(b.farmerShare + b.stewardShare + b.platformShare).toBe(0);
  });

  it("does not count an animal-purchase request and the purchase twice", () => {
    const spent = capitalSpent({
      purchaseCost: 800000,
      requests: [
        { status: "approved", amount: 800000, purpose: "animal_purchase" },
        { status: "approved", amount: 50000, purpose: "medical" },
      ],
    });
    expect(spent.spent).toBe(850000);
  });

  it("uses the animal-purchase request if it is larger than the recorded cost", () => {
    const spent = capitalSpent({
      purchaseCost: 700000,
      requests: [{ status: "approved", amount: 750000, purpose: "animal_purchase" }],
    });
    expect(spent.spent).toBe(750000);
  });

  it("counts an animal-purchase request inside the purchase, even one made later (KR-INV-000016 case)", () => {
    // Invested 10,00,000; bought 2 animals for 8,00,000; approved requests:
    // animal purchase 10,000 (toward the 8,00,000), medical 10,000, feed 30,000. All animals died.
    const spent = capitalSpent({
      purchaseCost: 800000,
      requests: [
        { status: "approved", amount: 10000, purpose: "animal_purchase" },
        { status: "approved", amount: 10000, purpose: "medical" },
        { status: "approved", amount: 30000, purpose: "feed" },
      ],
    });
    expect(spent.spent).toBe(840000);
    const b = computeSettlement({ capital: 1000000, fundsReleased: spent.spent, saleAmount: 0 });
    expect(b.investorPayout).toBe(160000);
  });

  it("counts approved expenses, not released fund money (KR-SALE-00014 case)", () => {
    // Invested 1,00,000; animals 60,000; requests feed 10,000 + medical 2,000;
    // expenses feed 7,000 + medical 1,000; sold for 1,40,000.
    const spent = capitalSpent({
      purchaseCost: 60000,
      requests: [
        { status: "approved", amount: 10000, purpose: "feed" },
        { status: "approved", amount: 2000, purpose: "medical" },
      ],
      expenses: [
        { status: "approved", amount: 7000, category: "feed" },
        { status: "approved", amount: 1000, category: "medical" },
        { status: "rejected", amount: 500, category: "feed" },
      ],
    });
    expect(spent).toMatchObject({ released: 72000, careSpent: 8000, leftover: 4000, spent: 68000 });

    // The farmer sends 1,40,000 + 4,000; settlement counts only what was spent.
    const b = computeSettlement({ capital: 100000, fundsReleased: spent.released - spent.leftover, saleAmount: 140000 });
    expect(b).toMatchObject({
      unspent: 32000,
      totalReturn: 172000,
      netResult: 72000,
      investorPayout: 121600,
      farmerShare: 43200,
      stewardShare: 3600,
      platformShare: 3600,
    });
  });

  it("does not count expenses beyond the care money released, or animal-purchase expenses", () => {
    const spent = capitalSpent({
      purchaseCost: 60000,
      requests: [{ status: "approved", amount: 5000, purpose: "feed" }],
      expenses: [
        { status: "approved", amount: 9000, category: "feed" },
        { status: "approved", amount: 60000, category: "animal_purchase" },
      ],
    });
    expect(spent).toMatchObject({ careSpent: 5000, leftover: 0, spent: 65000 });
  });

  it("counts all released care money as spent when no expenses are given", () => {
    const spent = capitalSpent({
      purchaseCost: 600000,
      requests: [{ status: "approved", amount: 51000, purpose: "feed" }],
    });
    expect(spent).toMatchObject({ released: 651000, leftover: 0, spent: 651000 });
  });

  it("ignores rejected requests and counts pending only when asked", () => {
    const requests = [
      { status: "rejected", amount: 99999, purpose: "feed" },
      { status: "pending", amount: 30000, purpose: "feed" },
    ];
    expect(capitalSpent({ purchaseCost: 100000, requests }).spent).toBe(100000);
    expect(capitalSpent({ purchaseCost: 100000, requests, includePending: true }).spent).toBe(130000);
  });
});
