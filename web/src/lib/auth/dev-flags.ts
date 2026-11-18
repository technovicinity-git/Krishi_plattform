/**
 * Testing shortcuts for one-time codes (until SMS delivery exists):
 *   FIXED_OTP     every code is this value (development default: 123456)
 *   DEV_SHOW_OTP  codes are stored in plain text and shown on screen
 *
 * Both are honoured in development, and in a production build only when the
 * server is explicitly marked as staging (KRISHI_STAGING=true). On a live site
 * they are ignored even if set, so a copied .env can't make every code
 * guessable. Server-only.
 */

const isProduction = process.env.NODE_ENV === "production";
const isStaging = process.env.KRISHI_STAGING === "true";
const testShortcutsAllowed = !isProduction || isStaging;

let warned = false;
function warnIgnored() {
  if (warned) return;
  warned = true;
  console.error(
    "[security] FIXED_OTP / DEV_SHOW_OTP are set but ignored in production. " +
      "Unset them, or set KRISHI_STAGING=true on a staging server.",
  );
}

/** The fixed one-time code to use, or null for a random code. */
export function fixedOtp(): string | null {
  const configured = process.env.FIXED_OTP?.trim();
  if (!testShortcutsAllowed) {
    if (configured) warnIgnored();
    return null;
  }
  return configured || (isProduction ? null : "123456");
}

/** Whether codes may be stored in plain text and shown on screen. */
export function showOtpOnScreen(): boolean {
  const on = process.env.DEV_SHOW_OTP === "true";
  if (on && !testShortcutsAllowed) {
    warnIgnored();
    return false;
  }
  return on;
}
