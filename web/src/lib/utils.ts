/** Format taka with Indian grouping: 50000 → ৳50,000, 100000 → ৳1,00,000. */
export function formatBDT(n: number): string {
  const s = String(Math.round(Number(n)));
  if (s.length <= 3) return `৳${s}`;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `৳${rest},${last3}`;
}
