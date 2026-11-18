import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { computeSettlement } from "@/lib/investments/settlement";
import { balanceOf, createTestDb, seedBasics, seedSaleReadyToSettle, type Seed } from "./helpers/db";

/*
 * The money rules that live in Postgres functions: settlement, wallet
 * credits, withdrawals and rate limits. Runs against a fresh PGlite database
 * built from the real migrations.
 */

let db: PGlite;
let s: Seed;

beforeAll(async () => {
  db = await createTestDb();
  s = await seedBasics(db);
});

/** Settles a sale the way the admin route does: compute in TS, save in SQL. */
async function settle(saleId: string, input: { capital: number; released: number; saleAmount: number }) {
  const b = computeSettlement({ capital: input.capital, fundsReleased: input.released, saleAmount: input.saleAmount });
  await db.query(
    `select settle_investment_sale($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, null)`,
    [saleId, s.adminId, b.capital, b.fundsReleased, b.saleAmount, b.totalReturn, b.netResult, b.outcome,
      b.investorPayout, b.farmerShare, b.stewardShare, b.platformShare, JSON.stringify(b.split)],
  );
  return b;
}

async function credits(investmentId: string) {
  const r = await db.query<{ user_id: string; type: string; amount: string }>(
    `select user_id, type, amount::text from wallet_transactions where investment_id = $1`,
    [investmentId],
  );
  return r.rows;
}

describe("settle_investment_sale", () => {
  it("settles a profitable sale and credits investor, farmer and steward", async () => {
    const input = { capital: 150000, released: 120000, saleAmount: 180000 };
    const { investmentId, saleId } = await seedSaleReadyToSettle(db, s, input);
    const b = await settle(saleId, input);

    const inv = await db.query<{ status: string; current_stage: string }>(
      `select status, current_stage from investments where id = $1`, [investmentId]);
    expect(inv.rows[0]).toEqual({ status: "completed", current_stage: "settled" });

    const sale = await db.query<{ status: string }>(`select status from investment_sales where id = $1`, [saleId]);
    expect(sale.rows[0].status).toBe("settled");

    const rows = await credits(investmentId);
    const byUser = Object.fromEntries(rows.map((r) => [r.user_id, Number(r.amount)]));
    expect(byUser[s.investorId]).toBe(b.investorPayout); // 1,68,000
    expect(byUser[s.farmerId]).toBe(b.farmerShare); //       36,000
    expect(byUser[s.stewardId]).toBe(b.stewardShare); //       3,000
    expect(rows).toHaveLength(3);
  });

  it("refuses to settle the same sale twice", async () => {
    const input = { capital: 100000, released: 50000, saleAmount: 120000 };
    const { investmentId, saleId } = await seedSaleReadyToSettle(db, s, input);
    await settle(saleId, input);
    await expect(settle(saleId, input)).rejects.toThrow(/SALE_NOT_READY/);
    expect(await credits(investmentId)).toHaveLength(3);
  });

  it("does not credit twice if credit_settlement runs again", async () => {
    const input = { capital: 100000, released: 50000, saleAmount: 130000 };
    const { investmentId, saleId } = await seedSaleReadyToSettle(db, s, input);
    await settle(saleId, input);
    const st = await db.query<{ id: string }>(`select id from investment_settlements where sale_id = $1`, [saleId]);
    await db.query(`select credit_settlement($1)`, [st.rows[0].id]);
    expect(await credits(investmentId)).toHaveLength(3);
  });

  it("on a loss credits only the investor, with what is left", async () => {
    const input = { capital: 150000, released: 140000, saleAmount: 100000 };
    const { investmentId, saleId } = await seedSaleReadyToSettle(db, s, input);
    const b = await settle(saleId, input);
    const rows = await credits(investmentId);
    expect(rows).toHaveLength(1);
    expect(rows[0].user_id).toBe(s.investorId);
    expect(Number(rows[0].amount)).toBe(b.investorPayout); // 1,10,000
  });

  it("only settles sales whose money was reported sent", async () => {
    const input = { capital: 100000, released: 0, saleAmount: 120000 };
    const { saleId } = await seedSaleReadyToSettle(db, s, input);
    await db.query(`update investment_sales set status = 'awaiting_remittance' where id = $1`, [saleId]);
    await expect(settle(saleId, input)).rejects.toThrow(/SALE_NOT_READY/);
  });
});

describe("withdrawals", () => {
  let user: string;

  beforeAll(async () => {
    // A fresh user with ৳10,000 in the wallet and a payout account.
    const r = await db.query<{ id: string }>(
      `insert into users (role, full_name, phone, status) values ('investor', 'Wallet User', '+8801700000099', 'active') returning id`);
    user = r.rows[0].id;
    await db.query(`insert into wallet_transactions (user_id, type, amount, description) values ($1, 'adjustment', 10000, 'test credit')`, [user]);
  });

  const request = (amount: number, min = 500) =>
    db.query<{ id: string }>(`select request_withdrawal($1, $2, $3) id`, [user, amount, min]);
  const close = (id: string, status: string) =>
    db.query(`select close_withdrawal($1, $2, $3, $4, null, $5)`, [id, status, s.adminId, status === "paid" ? "TXN1" : null, status === "rejected" ? "test" : null]);

  it("needs a payout account", async () => {
    await expect(request(1000)).rejects.toThrow(/NO_PAYOUT_ACCOUNT/);
    await db.query(
      `insert into withdrawal_preferences (user_id, method, mfs_provider, mobile_number, account_holder_name)
       values ($1, 'mobile', 'bkash', '+8801700000099', 'Wallet User')`, [user]);
  });

  it("enforces the minimum and the balance", async () => {
    await expect(request(100)).rejects.toThrow(/BELOW_MINIMUM/);
    await expect(request(10000.01)).rejects.toThrow(/INSUFFICIENT_BALANCE/);
  });

  it("holds the money as soon as it is requested", async () => {
    const r = await request(6000);
    expect(await balanceOf(db, user)).toBe(4000);
    // The held money can't be requested again.
    await expect(request(6000)).rejects.toThrow(/INSUFFICIENT_BALANCE/);
    // Reject → money comes back.
    await close(r.rows[0].id, "rejected");
    expect(await balanceOf(db, user)).toBe(10000);
  });

  it("keeps the money out when paid, and can't be closed twice", async () => {
    const r = await request(2500);
    await close(r.rows[0].id, "paid");
    expect(await balanceOf(db, user)).toBe(7500);
    await expect(close(r.rows[0].id, "cancelled")).rejects.toThrow(/NOT_PENDING/);
    expect(await balanceOf(db, user)).toBe(7500);
  });

  it("returns the money when the user cancels", async () => {
    const r = await request(7500);
    expect(await balanceOf(db, user)).toBe(0);
    await close(r.rows[0].id, "cancelled");
    expect(await balanceOf(db, user)).toBe(7500);
  });

  it("copies the payout account onto the request", async () => {
    const r = await request(500);
    const w = await db.query<{ method: string; mobile_number: string; status: string }>(
      `select method, mobile_number, status from withdrawal_requests where id = $1`, [r.rows[0].id]);
    expect(w.rows[0]).toEqual({ method: "mobile", mobile_number: "+8801700000099", status: "pending" });
  });
});

describe("hit_rate_limit", () => {
  const hit = async (bucket: string) =>
    (await db.query<{ ok: boolean }>(`select hit_rate_limit($1, 3, 60) ok`, [bucket])).rows[0].ok;

  it("allows up to the limit, then blocks", async () => {
    expect(await hit("test:a")).toBe(true);
    expect(await hit("test:a")).toBe(true);
    expect(await hit("test:a")).toBe(true);
    expect(await hit("test:a")).toBe(false);
    expect(await hit("test:a")).toBe(false);
  });

  it("keeps buckets separate", async () => {
    expect(await hit("test:b")).toBe(true);
  });
});
