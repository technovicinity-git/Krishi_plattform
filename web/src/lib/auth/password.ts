import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

/** Hash a plaintext password. Never log the input or output. */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

/**
 * A real bcrypt hash of a password nobody uses. Checking against it when the
 * account does not exist makes "no such account" take as long as "wrong
 * password", so response times do not reveal which numbers are registered.
 */
const DUMMY_HASH = "$2b$12$DMWGWBtdbQykD72enaEY7Ok2jVhbgJ3fy4OWndqO7Z9k/fA6KNYSu";

/** Checks a password when there is no stored hash; always false. */
export async function verifyAgainstNothing(plain: string): Promise<false> {
  await bcrypt.compare(plain, DUMMY_HASH);
  return false;
}

/** Constant-time comparison. */
export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}