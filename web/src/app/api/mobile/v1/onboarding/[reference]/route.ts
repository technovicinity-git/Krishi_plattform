import { NextResponse } from "next/server";
import { requireMobileUser, json } from "@/lib/mobile/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSslcommerzEnabled, isSslcommerzSandbox } from "@/lib/payments/sslcommerz";

export const runtime = "nodejs";

/**
 * Where an approved interest is on the way to becoming a batch, and what the
 * investor does next:
 *   kyc → payout → payment → review (deposit being checked) → done
 * plus the amount, Krishi's receiving accounts and whether online payment is on.
 * Actions: POST /api/kyc/submit, POST /api/onboarding/withdrawal,
 * POST /api/deposits (bank / mobile transfer) or POST /api/payments/sslcommerz/init.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ reference: string }> }) {
  const user = await requireMobileUser();
  if (user instanceof Response) return user;
  if (user.role !== "investor") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { reference } = await params;

  const db = createAdminClient();
  const { data: interest } = await db
    .from("investment_interests")
    .select(`
      id, reference, status, requested_units, rejection_reason,
      offering:steward_plan_offerings!offering_id (
        units_offered, units_funded,
        investment_plans ( name_en, name_bn, unit_price )
      ),
      investments ( id )
    `)
    .eq("reference", reference)
    .eq("investor_id", user.id)
    .maybeSingle();
  if (!interest) return NextResponse.json({ error: "Interest not found" }, { status: 404 });

  const offering = interest.offering as unknown as {
    units_offered: number;
    units_funded: number;
    investment_plans: { name_en: string | null; name_bn: string | null; unit_price: number | string } | null;
  } | null;
  const inv = interest.investments as unknown as { id: string }[] | { id: string } | null;
  const investmentId = (Array.isArray(inv) ? inv[0] : inv)?.id ?? null;

  const [{ data: payout }, { data: deposit }, { data: accounts }] = await Promise.all([
    db.from("withdrawal_preferences").select("method, mfs_provider, mobile_number, bank_name, bank_account_number").eq("user_id", user.id).maybeSingle(),
    db
      .from("deposits")
      .select("reference, status, method, amount, txn_id, rejection_reason, created_at")
      .eq("interest_id", interest.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db.from("platform_accounts").select("id, method, provider, account_name, account_number, branch_name").eq("is_active", true),
  ]);

  const kycDone = user.kycStatus === "verified";
  const step = investmentId || interest.status === "converted"
    ? "done"
    : !["approved", "onboarding"].includes(interest.status)
      ? "closed"
      : !kycDone
        ? "kyc"
        : !payout
          ? "payout"
          : deposit?.status === "pending"
            ? "review"
            : "payment";

  return json({
    step,
    interest: {
      id: interest.id,
      reference: interest.reference,
      status: interest.status,
      units: interest.requested_units,
      amount: Number(offering?.investment_plans?.unit_price ?? 0) * interest.requested_units,
      planEn: offering?.investment_plans?.name_en ?? "",
      planBn: offering?.investment_plans?.name_bn ?? offering?.investment_plans?.name_en ?? "",
      rejectionReason: interest.rejection_reason,
    },
    unitsLeft: offering ? Math.max(0, offering.units_offered - offering.units_funded) : 0,
    investmentId,
    kycStatus: user.kycStatus,
    kycRejectionReason: user.kycRejectionReason,
    hasPayout: Boolean(payout),
    deposit: deposit
      ? {
          reference: deposit.reference,
          status: deposit.status,
          method: deposit.method,
          amount: Number(deposit.amount),
          txnId: deposit.txn_id,
          rejectionReason: deposit.rejection_reason,
          createdAt: deposit.created_at,
        }
      : null,
    platformAccounts: (accounts ?? []).map((a) => ({
      id: a.id,
      method: a.method,
      provider: a.provider,
      accountName: a.account_name,
      accountNumber: a.account_number,
      branchName: a.branch_name,
    })),
    onlinePayment: { enabled: isSslcommerzEnabled(), sandbox: isSslcommerzSandbox() },
  });
}
