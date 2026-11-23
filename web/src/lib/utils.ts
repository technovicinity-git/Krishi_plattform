/** Format taka with Indian grouping: 50000 → ৳50,000, 100000 → ৳1,00,000. */
export function formatBDT(n: number): string {
  const s = String(Math.round(Number(n)));
  if (s.length <= 3) return `৳${s}`;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `৳${rest},${last3}`;
}

/** An estimated return range: "15–20%", or "20%" when both ends are equal. */
export function formatRoi(min: number | string | null | undefined, max: number | string | null | undefined): string {
  const a = Number(min ?? 0);
  const b = Number(max ?? 0);
  return a === b ? `${a}%` : `${a}–${b}%`;
}
