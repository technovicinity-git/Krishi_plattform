import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Every notification the app can send. Each one has a title/body in
 * messages under app.notify.<kind>. Params are interpolated into them;
 * `amount` is formatted as BDT when shown.
 */
export type NotificationKind =
  | "interest_submitted"
  | "interest_approved"
  | "interest_declined"
  | "deposit_approved"
  | "deposit_rejected"
  | "investment_new"
  | "farmer_assigned"
  | "batch_assigned"
  | "purchase_confirmed"
  | "update_posted"
  | "fund_requested"
  | "fund_approved"
  | "fund_rejected"
  | "expense_logged"
  | "expense_rejected"
  | "sale_recorded"
  | "sale_confirmed"
  | "sale_confirmed_investor"
  | "sale_rejected"
  | "remittance_rejected"
  | "settled_investor"
  | "settled_share"
  | "monthly_pay_sent"
  | "withdrawal_paid"
  | "withdrawal_rejected"
  | "kyc_approved"
  | "kyc_rejected"
  | "steward_approved"
  | "steward_rejected"
  | "animal_died"
  | "animal_death_reported"
  | "animal_death_rejected"
  | "total_loss_requested"
  | "total_loss_rejected"
  | "total_loss_return_funds"
  | "payment_refund_started"
  | "payment_refunded"
  // Admin console: something is waiting in an admin queue.
  | "admin_kyc_submitted"
  | "admin_deposit_submitted"
  | "admin_payment_review"
  | "admin_steward_applied"
  | "admin_remittance_submitted"
  | "admin_total_loss"
  | "admin_withdrawal_requested"
  | "review_received"
  | "offering_assigned"
  | "offering_assigned_pending"
  | "offering_approved"
  | "offering_paused"
  | "offering_closed"
  | "offering_rejected"
  | "offering_units"
  | "settlement_corrected_payout"
  | "settlement_corrected_share"
  | "settlement_corrected_request_payout"
  | "settlement_correction_reversed"
  | "settlement_recalculated_payout"
  | "settlement_recalculated_share"
  // Written by an admin in the console (title/body in params).
  | "custom";

export interface NotificationParams {
  reference?: string;
  amount?: number;
  name?: string;
  plan?: string;
  /** Bangla plan name; shown instead of `plan` to Bangla readers. */
  planBn?: string;
  reason?: string;
  title?: string;
  /** Custom notifications: Bangla title, and the message in each language. */
  titleBn?: string;
  body?: string;
  bodyBn?: string;
}

export interface NotifyTarget {
  userId: string | null | undefined;
  href?: string | null;
}

/**
 * Sends one notification kind to one or more users. Never throws: a failed
 * notification must not break the action that triggered it.
 */
export async function notify(
  kind: NotificationKind,
  targets: NotifyTarget | NotifyTarget[],
  params: NotificationParams = {},
  /** push: false keeps it in-app only (no push to phones). */
  options: { push?: boolean } = {},
): Promise<void> {
  const list = (Array.isArray(targets) ? targets : [targets]).filter(
    (t): t is { userId: string; href?: string | null } => Boolean(t.userId),
  );
  if (list.length === 0) return;

  // Drop empty values so messages only see what was set.
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""),
  );

  try {
    const { error } = await createAdminClient()
      .from("notifications")
      .insert(list.map((t) => ({ user_id: t.userId, kind, params: clean, href: t.href ?? null })));
    if (error) console.error(`[notify] ${kind} failed:`, error);
    // Also to their phones. Admin queue alerts stay in the console.
    if (!error && options.push !== false && !kind.startsWith("admin_")) {
      const { sendPush } = await import("./push");
      await sendPush(list.map((t) => ({ userId: t.userId, kind, params: clean as Record<string, string | number>, href: t.href ?? null })));
    }
  } catch (err) {
    console.error(`[notify] ${kind} failed:`, err);
  }
}

/**
 * Notifies every admin (for the Krishi console). `href` is a console path,
 * e.g. "/krishi-console/sales/<id>". Never throws.
 */
export async function notifyAdmins(
  kind: Extract<NotificationKind, `admin_${string}`>,
  href: string,
  params: NotificationParams = {},
): Promise<void> {
  try {
    const { data } = await createAdminClient()
      .from("users")
      .select("id")
      .eq("role", "admin")
      .eq("status", "active");
    await notify(kind, (data ?? []).map((a) => ({ userId: a.id, href })), params);
  } catch (err) {
    console.error(`[notifyAdmins] ${kind} failed:`, err);
  }
}

/** Investor, steward and farmer IDs plus labels for an investment. Server-only. */
export async function investmentParties(investmentId: string): Promise<{
  investorId: string | null;
  farmerId: string | null;
  stewardId: string | null;
  reference: string;
  plan: string;
  planBn: string;
} | null> {
  const { data } = await createAdminClient()
    .from("investments")
    .select(`
      reference, investor_id, farmer_id,
      offering:steward_plan_offerings!offering_id ( steward_id, investment_plans ( name_en, name_bn ) )
    `)
    .eq("id", investmentId)
    .maybeSingle();
  if (!data) return null;
  const offering = data.offering as unknown as {
    steward_id: string;
    investment_plans: { name_en: string | null; name_bn: string | null } | null;
  } | null;
  return {
    investorId: data.investor_id,
    farmerId: data.farmer_id,
    stewardId: offering?.steward_id ?? null,
    reference: data.reference,
    plan: offering?.investment_plans?.name_en ?? "",
    planBn: offering?.investment_plans?.name_bn ?? offering?.investment_plans?.name_en ?? "",
  };
}

/**
 * Tells a steward about a change to their offering on a plan (assigned,
 * approved, paused, closed, rejected, units changed). Never throws.
 */
export async function notifyOfferingChange(
  offeringId: string,
  kind: Extract<
    NotificationKind,
    | "offering_assigned"
    | "offering_assigned_pending"
    | "offering_approved"
    | "offering_paused"
    | "offering_closed"
    | "offering_rejected"
    | "offering_units"
  >,
  extra: { reason?: string | null } = {},
): Promise<void> {
  const { data } = await createAdminClient()
    .from("steward_plan_offerings")
    .select("steward_id, units_offered, investment_plans ( name_en, name_bn )")
    .eq("id", offeringId)
    .maybeSingle();
  if (!data) return;
  const plan = data.investment_plans as unknown as { name_en: string | null; name_bn: string | null } | null;
  await notify(
    kind,
    { userId: data.steward_id, href: "/steward/plans" },
    {
      plan: plan?.name_en ?? undefined,
      planBn: plan?.name_bn ?? plan?.name_en ?? undefined,
      // Units offered, shown as a plain number.
      title: String(data.units_offered),
      reason: extra.reason ?? undefined,
    },
  );
}
