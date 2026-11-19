import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { createTestDb, seedBasics } from "./helpers/db";

/**
 * The Supabase URL and publishable key are public, so anyone can call the
 * database API as `anon` (or `authenticated` after a Supabase Auth sign-up).
 * The app only uses service_role from the server. These tests make sure the
 * migrations leave the public roles with nothing: no table rights, no
 * policies, no functions. See 20261119000005_lock_down_public_roles.sql.
 */
const PUBLIC_ROLES = ["anon", "authenticated"];
const TABLE_RIGHTS = ["SELECT", "INSERT", "UPDATE", "DELETE", "TRUNCATE", "REFERENCES", "TRIGGER"];

describe("database is closed to the public API roles", () => {
  let db: PGlite;
  beforeAll(async () => {
    db = await createTestDb();
  }, 120_000);

  it("has row-level security on every table", async () => {
    const { rows } = await db.query<{ table: string }>(`
      select c.relname as table from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity`);
    expect(rows.map((r) => r.table)).toEqual([]);
  });

  it("gives anon and authenticated no rights on any table", async () => {
    const leaks: string[] = [];
    const { rows } = await db.query<{ oid: number; table: string }>(`
      select c.oid, c.relname as table from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm')`);
    for (const role of PUBLIC_ROLES) {
      for (const t of rows) {
        for (const right of TABLE_RIGHTS) {
          const { rows: r } = await db.query<{ ok: boolean }>(`select has_table_privilege($1, $2::oid, $3) as ok`, [role, t.oid, right]);
          if (r[0].ok) leaks.push(`${role} ${right} ${t.table}`);
        }
      }
    }
    expect(leaks).toEqual([]);
  });

  it("has no policies that apply to the public roles", async () => {
    const { rows } = await db.query<{ policy: string }>(`
      select tablename || '.' || policyname as policy from pg_policies
       where schemaname = 'public' and roles && array['public', 'anon', 'authenticated']::name[]`);
    expect(rows.map((r) => r.policy)).toEqual([]);
  });

  it("lets the public roles execute no function and use no sequence", async () => {
    const { rows } = await db.query<{ name: string }>(`
      select p.proname as name from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public'
         and (has_function_privilege('anon', p.oid, 'execute') or has_function_privilege('authenticated', p.oid, 'execute'))
      union all
      select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'S'
         and (has_sequence_privilege('anon', c.oid, 'usage') or has_sequence_privilege('authenticated', c.oid, 'usage'))`);
    expect(rows.map((r) => r.name)).toEqual([]);
  });

  it("still lets the server role work (defaults, sequences, RPCs)", async () => {
    const seed = await seedBasics(db);
    await db.exec("set role service_role");
    try {
      // Reference defaults call functions and sequences.
      const { rows } = await db.query<{ reference: string }>(
        `insert into investment_interests (offering_id, investor_id, requested_units, status)
         values ($1, $2, 1, 'submitted') returning reference`,
        [seed.offeringId, seed.investorId],
      );
      expect(rows[0].reference).toMatch(/^KR-INT-/);
      const { rows: limited } = await db.query<{ ok: boolean }>(`select public.hit_rate_limit('test', 5, 60) as ok`);
      expect(limited[0].ok).toBe(true);
    } finally {
      await db.exec("reset role");
    }
  });
});
