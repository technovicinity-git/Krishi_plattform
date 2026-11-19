import { requireMobileUser, json, localeOf, investmentIdsFor, translators, timelineText } from "@/lib/mobile/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWallet } from "@/lib/wallet";
import { getUnreadCount } from "@/lib/notifications/read";

export const runtime = "nodejs";

/** Home screen for each role: figures, things to do and the latest activity. */
export async function GET(request: Request) {
  const user = await requireMobileUser();
  if (user instanceof Response) return user;
  const db = createAdminClient();
  const ids = await investmentIdsFor(user);

  const [wallet, unread, t, { data: invRows }, { data: updateRows }] = await Promise.all([
    getWallet(user.id),
    getUnreadCount(user.id),
    translators(localeOf(request)),
    ids.length
      ? db.from("investments").select("id, reference, units, amount, current_stage").in("id", ids)
      : Promise.resolve({ data: [] as Array<{ id: string; reference: string; units: number; amount: number; current_stage: string | null }> }),
    ids.length
      ? db
          .from("investment_updates")
          .select("id, investment_id, title, body, amount, created_at, metadata")
          .in("investment_id", ids)
          .order("created_at", { ascending: false })
          .limit(8)
      : Promise.resolve({ data: [] as Array<{ id: string; investment_id: string; title: string; body: string | null; amount: number | null; created_at: string; metadata: unknown }> }),
  ]);

  const investments = invRows ?? [];
  const active = investments.filter((i) => i.current_stage !== "settled");
  const refs = new Map(investments.map((i) => [i.id, i.reference]));
  const activity = (updateRows ?? []).map((u) => {
    const text = timelineText(t, u);
    return {
      id: u.id,
      investmentId: u.investment_id,
      reference: refs.get(u.investment_id) ?? "",
      title: text.title,
      amount: u.amount === null ? null : Number(u.amount),
      superseded: Boolean((u.metadata as { superseded?: boolean } | null)?.superseded),
      createdAt: u.created_at,
    };
  });

  const base = {
    role: user.role,
    fullName: user.fullName,
    kycStatus: user.kycStatus,
    unreadNotifications: unread,
    walletBalance: wallet.balance,
    activeBatches: active.length,
    activeUnits: active.reduce((s, i) => s + i.units, 0),
    activity,
  };

  if (user.role === "investor") {
    const [{ data: settlements }, { data: interests }] = await Promise.all([
      ids.length
        ? db.from("investment_settlements").select("capital, investor_payout").in("investment_id", ids)
        : Promise.resolve({ data: [] as Array<{ capital: number; investor_payout: number }> }),
      db
        .from("investment_interests")
        .select("reference, status, requested_units, offering:steward_plan_offerings!offering_id ( investment_plans ( name_en, name_bn ) )")
        .eq("investor_id", user.id)
        .in("status", ["submitted", "under_review", "approved"]),
    ]);
    type I = { reference: string; status: string; requested_units: number; offering: { investment_plans: { name_en: string | null; name_bn: string | null } | null } | null };
    const list = (interests ?? []) as unknown as I[];
    return json({
      ...base,
      invested: active.reduce((s, i) => s + Number(i.amount), 0),
      returns: (settlements ?? []).reduce((s, x) => s + Number(x.investor_payout) - Number(x.capital), 0),
      interestsWaiting: list.filter((i) => i.status !== "approved").length,
      // Payment happens on the website (online payment / deposit proof).
      toPay: list
        .filter((i) => i.status === "approved")
        .map((i) => ({
          reference: i.reference,
          units: i.requested_units,
          planEn: i.offering?.investment_plans?.name_en ?? "",
          planBn: i.offering?.investment_plans?.name_bn ?? i.offering?.investment_plans?.name_en ?? "",
          path: `/onboarding/${i.reference}`,
        })),
    });
  }

  /** Rows in `table` for these batches with the given status. */
  const count = async (table: string, status: string) => {
    if (!ids.length) return 0;
    const { count: c } = await db
      .from(table)
      .select("id", { count: "exact", head: true })
      .in("investment_id", ids)
      .eq("status", status);
    return c ?? 0;
  };

  if (user.role === "farmer") {
    const [pendingFunds, pendingExpenses, { data: sales }] = await Promise.all([
      count("fund_requests", "pending"),
      count("expenses", "pending"),
      ids.length
        ? db.from("investment_sales").select("investment_id, sale_amount, funds_returned, status").in("investment_id", ids).eq("status", "awaiting_remittance")
        : Promise.resolve({ data: [] as Array<{ investment_id: string; sale_amount: number; funds_returned: number; status: string }> }),
    ]);
    return json({
      ...base,
      pendingFundRequests: pendingFunds,
      pendingExpenses,
      needsPurchase: active.filter((i) => i.current_stage === "awaiting_purchase").map((i) => ({ id: i.id, reference: i.reference })),
      moneyToSend: (sales ?? []).map((s) => ({
        investmentId: s.investment_id,
        reference: refs.get(s.investment_id) ?? "",
        amount: Number(s.sale_amount) + Number(s.funds_returned ?? 0),
      })),
    });
  }

  // Steward
  const [pendingFunds, pendingExpenses, pendingSales, { count: deathReports }, { count: interests }] = await Promise.all([
    count("fund_requests", "pending"),
    count("expenses", "pending"),
    count("investment_sales", "pending_review"),
    ids.length
      ? db.from("animals").select("id", { count: "exact", head: true }).in("investment_id", ids).eq("status", "death_reported")
      : Promise.resolve({ count: 0 }),
    db
      .from("investment_interests")
      .select("id, offering:steward_plan_offerings!offering_id!inner ( steward_id )", { count: "exact", head: true })
      .eq("offering.steward_id", user.id)
      .in("status", ["submitted", "under_review"]),
  ]);
  return json({
    ...base,
    pending: {
      fundRequests: pendingFunds,
      expenses: pendingExpenses,
      sales: pendingSales,
      deathReports: deathReports ?? 0,
      interests: interests ?? 0,
    },
    awaitingFarmer: active.filter((i) => i.current_stage === "awaiting_farmer").length,
  });
}
