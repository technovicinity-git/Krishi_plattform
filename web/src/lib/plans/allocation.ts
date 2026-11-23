/**
 * A plan's Animal + Care allocation must equal its unit price. Given the
 * unit price and one allocation, returns the other one, or null when it
 * can't be worked out yet (a field is empty, not a number, negative, or the
 * allocation is bigger than the unit price). Pure: safe on client and server.
 */
export function otherAllocation(unitPrice: string, allocation: string): string | null {
  if (unitPrice.trim() === "" || allocation.trim() === "") return null;
  const total = Number(unitPrice);
  const part = Number(allocation);
  if (!Number.isFinite(total) || !Number.isFinite(part) || part < 0 || part > total) return null;
  return String(Math.round((total - part) * 100) / 100);
}
