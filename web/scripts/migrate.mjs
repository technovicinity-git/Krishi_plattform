/**
 * Migration runner for Krishi.
 *
 * Bypasses the Supabase CLI (blocked by the scoped-token bug) by
 * connecting directly via DATABASE_URL. Behaviour mirrors
 * `supabase db push`:
 *
 *   - Applied migrations are tracked in a `_migrations` table
 *   - Each migration runs in its own transaction (atomic rollback on error)
 *   - SHA-256 checksums prevent editing migrations after they are applied
 *   - Advisory lock prevents concurrent runs
 *   - SSL is enforced
 *
 * Usage:
 *   npm run db:migrate
 */

import postgres from "postgres";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

// ─── Safety guards ────────────────────────────────────────────────────────────

// Guard 1: this script must never end up in a browser bundle.
if (typeof window !== "undefined") {
  throw new Error("Migration script must only run on the server");
}

// Guard 2: fail fast if the connection string is missing.
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("\n✗ DATABASE_URL is not set.");
  console.error("  Add it to web/.env.local — see .env.local.example\n");
  process.exit(1);
}

// ─── Configuration ────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "..", "supabase", "migrations");

// Advisory lock key — arbitrary but must be consistent across runs.
const ADVISORY_LOCK_KEY = 42987001;

// Parse the URL to log a safe hostname (never the password).
const safeHost = new URL(DATABASE_URL).hostname;

// ─── Connection ───────────────────────────────────────────────────────────────

const sql = postgres(DATABASE_URL, {
  ssl: "require",       // Enforce TLS on the wire
  max: 1,               // Serialize — migrations are not concurrent-safe
  idle_timeout: 5,
  connect_timeout: 10,
  onnotice: () => {},   // Suppress NOTICE noise
});

// ─── Runner ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(`→ Connecting to ${safeHost}...`);

  // 1. Ensure the migrations tracking table exists.
  await sql`
    create table if not exists _migrations (
      id          serial primary key,
      filename    text not null unique,
      checksum    text not null,
      applied_at  timestamptz not null default now()
    )
  `;

  // 2. Acquire a Postgres advisory lock so two runs can't collide.
  console.log("→ Acquiring advisory lock...");
  await sql`select pg_advisory_lock(${ADVISORY_LOCK_KEY})`;

  try {
    // 3. List SQL files in deterministic order.
    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    console.log(`→ Found ${files.length} migration file(s)`);

    // 4. Fetch already-applied migrations.
    const applied = await sql`select filename, checksum from _migrations`;
    const appliedMap = new Map(applied.map((r) => [r.filename, r.checksum]));

    let appliedCount = 0;
    let skippedCount = 0;

    for (const filename of files) {
      const path = join(migrationsDir, filename);
      if (!statSync(path).isFile()) continue;

      const content = readFileSync(path, "utf8");
      const checksum = createHash("sha256").update(content).digest("hex");

      const existingChecksum = appliedMap.get(filename);

      // Already applied → verify the file hasn't been edited.
      if (existingChecksum !== undefined) {
        if (existingChecksum !== checksum) {
          console.error(`\n✗ Checksum mismatch for ${filename}`);
          console.error("  This migration was already applied with different content.");
          console.error("  Do not edit applied migrations. Create a new one instead.");
          process.exit(1);
        }
        skippedCount++;
        continue;
      }

      // New migration → apply inside a transaction.
      console.log(`→ Applying ${filename}...`);
      try {
        await sql.begin(async (tx) => {
          // .unsafe() is correct here — we are executing a trusted, static
          // SQL file that we authored, not composing a query from user input.
          await tx.unsafe(content);
          await tx`
            insert into _migrations (filename, checksum)
            values (${filename}, ${checksum})
          `;
        });
        appliedCount++;
        console.log(`  ✓ ${filename}`);
      } catch (err) {
        console.error(`\n✗ Migration failed: ${filename}`);
        console.error(`  ${err.message}`);
        console.error("  All changes have been rolled back.");
        process.exit(1);
      }
    }

    console.log(`\n✓ Done.  Applied: ${appliedCount}  Skipped: ${skippedCount}`);
  } finally {
    await sql`select pg_advisory_unlock(${ADVISORY_LOCK_KEY})`;
    await sql.end();
  }
}

main().catch((err) => {
  console.error("\n✗ Unexpected error:", err.message);
  process.exit(1);
});