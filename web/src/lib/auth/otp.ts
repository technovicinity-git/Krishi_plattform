import bcrypt from "bcryptjs";

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 5;
/** OTPs are short-lived and low-entropy; a cheaper cost is fine. */
const OTP_BCRYPT_ROUNDS = 8;

/** Generate a cryptographically secure 6-digit OTP. */
export function generateOtp(): string {
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