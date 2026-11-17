import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

/** Hash a plaintext password. Never log the input or output. */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

/** Constant-time comparison. */
export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}