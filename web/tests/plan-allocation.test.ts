import { describe, expect, it } from "vitest";
import { otherAllocation } from "@/lib/plans/allocation";

describe("plan allocation auto-fill", () => {
  it("fills the other allocation so the two add up to the unit price", () => {
    expect(otherAllocation("100000", "70000")).toBe("30000");
    expect(otherAllocation("100000", "0")).toBe("100000");
    expect(otherAllocation("100000", "100000")).toBe("0");
    expect(otherAllocation("1000.5", "0.25")).toBe("1000.25");
  });

  it("waits while a field is empty or invalid", () => {
    expect(otherAllocation("", "5000")).toBeNull();
    expect(otherAllocation("100000", "")).toBeNull();
    expect(otherAllocation("abc", "5000")).toBeNull();
    expect(otherAllocation("100000", "-1")).toBeNull();
  });

  it("doesn't go negative when the allocation is bigger than the unit price", () => {
    expect(otherAllocation("100000", "120000")).toBeNull();
  });
});
