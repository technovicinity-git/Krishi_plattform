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
  | "withdrawal_paid"
  | "withdrawal_rejected"
  | "kyc_approved"
  | "kyc_rejected"
  | "steward_approved"
  | "steward_rejected";

export interface NotificationParams {
  reference?: string;
  amount?: number;
  name?: string;
  plan?: string;
  /** Bangla plan name; shown instead of `plan` to Bangla readers. */
  planBn?: string;
  reason?: string;
  title?: string;
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
  } catch (err) {
    console.error(`[notify] ${kind} failed:`, err);
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
