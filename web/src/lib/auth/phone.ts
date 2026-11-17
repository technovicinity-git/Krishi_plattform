/**
 * Normalizes a Bangladeshi phone number to E.164 (+8801XXXXXXXXX).
 * Accepts input like "1712345678" or "01712345678" or "+8801712345678".
 */
export function toE164(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const withoutLeadingZero = digits.startsWith("0") ? digits.slice(1) : digits;
  const withoutCountryCode = withoutLeadingZero.startsWith("880")
    ? withoutLeadingZero.slice(3)
    : withoutLeadingZero;
  return `+880${withoutCountryCode}`;
}

/** Validates Bangladeshi mobile numbers (operator prefixes 13–19). */
export function isValidBDPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  const normalized = digits.startsWith("0") ? digits.slice(1) : digits;
  const withoutCountryCode = normalized.startsWith("880")
    ? normalized.slice(3)
    : normalized;
  return /^1[3-9]\d{8}$/.test(withoutCountryCode);
}