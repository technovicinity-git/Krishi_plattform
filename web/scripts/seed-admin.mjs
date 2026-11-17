/**
 * Seeds (or updates) an admin account.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-admin.mjs <email> <password> [name]
 *
 * Example:
 *   node --env-file=.env.local scripts/seed-admin.mjs admin@krishi.com.bd "StrongP@ss123" "Krishi Admin"
 */

import postgres from "postgres";
import bcrypt from "bcryptjs";

const [, , email, password, name = "Krishi Admin"] = process.argv;

if (!email || !password) {
  console.error("Usage: node scripts/seed-admin.mjs <email> <password> [name]");
  process.exit(1);
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("Invalid email");
  process.exit(1);
}
if (password.length < 12) {
  console.error("Admin passwords must be at least 12 characters");
  process.exit(1);
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set in env");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { ssl: "require", max: 1 });

async function main() {
  const hash = await bcrypt.hash(password, 12);

  const existing = await sql`
    select id from public.users where email = ${email} and role = 'admin' limit 1
  `;

  if (existing.length > 0) {
    await sql`
      update public.users
      set password_hash = ${hash}, status = 'active', full_name = ${name}
      where id = ${existing[0].id}
    `;
    console.log(`✓ Updated existing admin: ${email}`);
  } else {
    await sql`
      insert into public.users (role, full_name, email, password_hash, status)
      values ('admin', ${name}, ${email}, ${hash}, 'active')
    `;
    console.log(`✓ Created new admin: ${email}`);
  }

  await sql.end();
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});