import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

/**
 * A throwaway Postgres (PGlite, in-process) built from every migration in
 * supabase/migrations, with minimal stand-ins for the parts of Supabase the
 * migrations touch (auth/storage schemas and roles). Nothing here talks to the
 * real database.
 */
export async function createTestDb(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin;
    create schema auth;
    create table auth.users (id uuid primary key default gen_random_uuid(), email text, phone text, raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
    create schema storage;
    create table storage.buckets (id text primary key, name text not null, public boolean default false,
      file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
    alter table storage.objects enable row level security;
    -- created by scripts/migrate.mjs before any migration runs
    create table public._migrations (id serial primary key, filename text not null unique,
      checksum text not null, applied_at timestamptz not null default now());
  `);

  const dir = path.join(__dirname, "..", "..", "supabase", "migrations");
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    try {
      await db.exec(readFileSync(path.join(dir, file), "utf8"));
    } catch (err) {
      throw new Error(`Migration ${file} failed: ${(err as Error).message}`);
    }
  }
  return db;
}

export interface Seed {
  investorId: string;
  farmerId: string;
  stewardId: string;
  adminId: string;
  offeringId: string;
}

/** Users (investor, farmer, steward, admin), a plan and an approved offering. */
export async function seedBasics(db: PGlite): Promise<Seed> {
  const one = async <T>(sql: string, params: unknown[] = []) =>
    ((await db.query<T>(sql, params)).rows[0] as T);

  const user = async (role: string, name: string, phone: string) =>
    (await one<{ id: string }>(
      `insert into users (role, full_name, phone, status) values ($1, $2, $3, 'active') returning id`,
      [role, name, phone],
    )).id;

  const investorId = await user("investor", "Test Investor", "+8801700000001");
  const farmerId = await user("farmer", "Test Farmer", "+8801700000002");
  const stewardId = await user("steward", "Test Steward", "+8801700000003");
  const adminId = await user("admin", "Test Admin", "+8801700000004");

  const ref = await one<{ category_id: string; division_id: string; district_id: string }>(`
    select (select id from livestock_categories limit 1) category_id,
           d.division_id, d.id district_id
      from districts d limit 1`);
  const plan = await one<{ id: string }>(
    `insert into investment_plans (slug, name_en, name_bn, category_id, division_id, district_id,
       duration_months, unit_price, animal_allocation, care_allocation, estimated_roi_min, estimated_roi_max, status)
     values ('test-plan', 'Test Plan', 'টেস্ট প্ল্যান', $1, $2, $3, 6, 150000, 100000, 50000, 15, 20, 'open')
     returning id`,
    [ref.category_id, ref.division_id, ref.district_id],
  );
  const offering = await one<{ id: string }>(
    `insert into steward_plan_offerings (plan_id, steward_id, units_offered, status)
     values ($1, $2, 10, 'approved') returning id`,
    [plan.id, stewardId],
  );
  return { investorId, farmerId, stewardId, adminId, offeringId: offering.id };
}

/**
 * A funded investment of `capital`, with `released` paid out to the farmer
 * through an approved fund request and a sale of `saleAmount` whose money
 * the farmer has sent (ready to settle). Returns the ids.
 */
export async function seedSaleReadyToSettle(
  db: PGlite,
  s: Seed,
  opts: { capital: number; released: number; saleAmount: number },
): Promise<{ investmentId: string; saleId: string }> {
  const one = async <T>(sql: string, params: unknown[] = []) =>
    ((await db.query<T>(sql, params)).rows[0] as T);

  const interest = await one<{ id: string }>(
    `insert into investment_interests (offering_id, investor_id, requested_units, status)
     values ($1, $2, 1, 'converted') returning id`,
    [s.offeringId, s.investorId],
  );
  const inv = await one<{ id: string }>(
    `insert into investments (interest_id, investor_id, offering_id, units, amount, farmer_id, current_stage)
     values ($1, $2, $3, 1, $4, $5, 'sold') returning id`,
    [interest.id, s.investorId, s.offeringId, opts.capital, s.farmerId],
  );
  if (opts.released > 0) {
    await db.query(
      `insert into fund_requests (investment_id, farmer_id, amount, purpose, status)
       values ($1, $2, $3, 'feed', 'approved')`,
      [inv.id, s.farmerId, opts.released],
    );
  }
  const sale = await one<{ id: string }>(
    `insert into investment_sales (investment_id, farmer_id, animals_sold, sale_amount, sale_date, status,
       remit_method, remitted_at)
     values ($1, $2, 1, $3, current_date, 'remittance_submitted', 'cash', now()) returning id`,
    [inv.id, s.farmerId, opts.saleAmount],
  );
  return { investmentId: inv.id, saleId: sale.id };
}

/** Sum of a user's wallet transactions (their balance). */
export async function balanceOf(db: PGlite, userId: string): Promise<number> {
  const r = await db.query<{ b: string }>(
    `select coalesce(sum(amount), 0)::text b from wallet_transactions where user_id = $1`,
    [userId],
  );
  return Number(r.rows[0].b);
}
