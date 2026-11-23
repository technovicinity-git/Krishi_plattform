import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { balanceOf, createTestDb, seedBasics, type Seed } from "./helpers/db";

/** Approved fund requests are credited to the farmer's wallet, once, so they can withdraw them. */
describe("fund release to the farmer's wallet", () => {
  let db: PGlite;
  let s: Seed;
  let investmentId: string;

  beforeAll(async () => {
    db = await createTestDb();
    s = await seedBasics(db);
    const interest = await db.query<{ id: string }>(
      `insert into investment_interests (offering_id, investor_id, requested_units, status) values ($1, $2, 1, 'converted') returning id`,
      [s.offeringId, s.investorId],
    );
    const inv = await db.query<{ id: string }>(
      `insert into investments (interest_id, investor_id, offering_id, units, amount, farmer_id, current_stage)
       values ($1, $2, $3, 1, 100000, $4, 'growing_care') returning id`,
      [interest.rows[0].id, s.investorId, s.offeringId, s.farmerId],
    );
    investmentId = inv.rows[0].id;
  }, 120_000);

  const request = async (amount: number, purpose = "feed") =>
    (
      await db.query<{ id: string }>(
        `insert into fund_requests (investment_id, farmer_id, amount, purpose, status) values ($1, $2, $3, $4, 'pending') returning id`,
        [investmentId, s.farmerId, amount, purpose],
      )
    ).rows[0].id;
  const setStatus = (id: string, status: string) => db.query(`update fund_requests set status = $2 where id = $1`, [id, status]);

  it("credits nothing while the request is pending or rejected", async () => {
    const before = await balanceOf(db, s.farmerId);
    await setStatus(await request(5000), "rejected");
    expect(await balanceOf(db, s.farmerId)).toBe(before);
  });

  it("credits the farmer once when the steward approves", async () => {
    const before = await balanceOf(db, s.farmerId);
    const id = await request(30000, "animal_purchase");
    await setStatus(id, "approved");
    expect(await balanceOf(db, s.farmerId)).toBe(before + 30000);

    // A later status change (e.g. marked disbursed) doesn't credit again.
    await setStatus(id, "disbursed");
    expect(await balanceOf(db, s.farmerId)).toBe(before + 30000);

    const { rows } = await db.query<{ type: string; description: string }>(
      `select type, description from wallet_transactions where fund_request_id = $1`,
      [id],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].type).toBe("fund_release");
    expect(rows[0].description).toContain("animal purchase");
  });

  it("lets the farmer request a withdrawal of the released money", async () => {
    await db.query(
      `insert into withdrawal_preferences (user_id, method, mfs_provider, mobile_number, account_holder_name)
       values ($1, 'mobile', 'bkash', '+8801700000077', 'Farmer')`,
      [s.farmerId],
    );
    const before = await balanceOf(db, s.farmerId);
    const { rows } = await db.query<{ id: string }>(`select request_withdrawal($1, $2, $3) id`, [s.farmerId, 20000, 500]);
    expect(rows[0].id).toBeTruthy();
    expect(await balanceOf(db, s.farmerId)).toBe(before - 20000);
  });
});
