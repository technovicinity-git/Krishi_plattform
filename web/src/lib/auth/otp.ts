import bcrypt from "bcryptjs";

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 5;
/** OTPs are short-lived and low-entropy; a cheaper cost is fine. */
const OTP_BCRYPT_ROUNDS = 8;

/**
 * TEMPORARY (testing only): fixed OTP until SMS delivery is set up.
 * - Development (`npm run dev`): always "123456" unless FIXED_OTP overrides it.
 * - Production builds: random, unless FIXED_OTP is explicitly set
 *   (e.g. on a staging server). Never set FIXED_OTP on a live site.
 * TODO: remove once an SMS provider is integrated.
 */
const FIXED_OTP =
  process.env.FIXED_OTP ||
  (process.env.NODE_ENV !== "production" ? "123456" : undefined);

/** Generate a 6-digit OTP (fixed while testing, see FIXED_OTP above). */
export function generateOtp(): string {
  if (FIXED_OTP) return FIXED_OTP;

  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const num = buf[0] % 1_000_000;
  return String(num).padStart(OTP_LENGTH, "0");
}

export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, OTP_BCRYPT_ROUNDS);
}

export async function verifyOtpHash(
  otp: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}

export function getOtpExpiry(): Date {
  return new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
}