import { describe, expect, it } from "vitest";
import { computeSettlement, PROFIT_SPLIT, releasedFunds } from "@/lib/investments/settlement";

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
