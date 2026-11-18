import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { initSession, isSslcommerzEnabled } from "@/lib/payments/sslcommerz";
import { appBaseUrl } from "@/lib/payments/urls";

export const runtime = "nodejs";

const schema = z.object({
  interest_id: z.string().uuid(),
  locale: z.enum(["bn", "en"]).default("bn"),
});

/**
 * Investor starts an online payment for an approved interest. The amount is
 * worked out here (unit price × units). Returns the SSLCommerz page to open.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "investor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSslcommerzEnabled()) {
    return NextResponse.json({ error: "Online payment is not available yet" }, { status: 503 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { interest_id, locale } = parsed.data;

  const db = createAdminClient();
  const { data: interest } = await db
    .from("investment_interests")
    .select(`
      id, reference, status, requested_units,
      offering:steward_plan_offerings!offering_id ( units_offered, units_funded, investment_plans ( name_en, unit_price ) )
    `)
    .eq("id", interest_id)
    .eq("investor_id", user.id)
    .maybeSingle();
  if (!interest || interest.status !== "approved") {
    return NextResponse.json({ error: "This interest is not ready for payment" }, { status: 400 });
  }

  // Same preconditions as the onboarding steps: KYC verified, payout account set.
  const [{ data: kyc }, { data: pref }, { data: pendingDeposit }] = await Promise.all([
    db.from("kyc_profiles").select("status").eq("user_id", user.id).maybeSingle(),
    db.from("withdrawal_preferences").select("user_id").eq("user_id", user.id).maybeSingle(),
    db.from("deposits").select("id").eq("interest_id", interest.id).in("status", ["pending", "approved"]).limit(1).maybeSingle(),
  ]);
  if (kyc?.status !== "verified") return NextResponse.json({ error: "Complete KYC first" }, { status: 400 });
  if (!pref) return NextResponse.json({ error: "Add a payout account first" }, { status: 400 });
  if (pendingDeposit) return NextResponse.json({ error: "A deposit for this interest is already being processed" }, { status: 409 });

  const offering = interest.offering as unknown as {
    units_offered: number;
    units_funded: number;
    investment_plans: { name_en: string | null; unit_price: number | string } | null;
  } | null;
  const amount = Number(offering?.investment_plans?.unit_price ?? 0) * interest.requested_units;
  if (!(amount > 0)) return NextResponse.json({ error: "This plan has no unit price set" }, { status: 400 });
  if (offering && offering.units_funded + interest.requested_units > offering.units_offered) {
    return NextResponse.json({ error: "Not enough units left on this offering" }, { status: 409 });
  }

  const { data: payment, error } = await db
    .from("online_payments")
    .insert({ interest_id: interest.id, investor_id: user.id, amount, locale })
    .select("id, tran_id")
    .single();
  if (error || !payment) {
    console.error("[sslcommerz/init] insert failed:", error);
    return NextResponse.json({ error: "Could not start the payment" }, { status: 500 });
  }

  const base = appBaseUrl(request);
  const cb = (path: string) => `${base}/api/payments/sslcommerz/${path}`;
  const result = await initSession({
    tranId: payment.tran_id,
    amount,
    successUrl: cb("success"),
    failUrl: cb("fail"),
    cancelUrl: cb("cancel"),
    ipnUrl: cb("ipn"),
    customer: {
      name: user.fullName ?? "Krishi investor",
      email: user.email ?? "noreply@krishi.com.bd",
      phone: user.phone ?? "N/A",
      address: "Bangladesh",
      city: "Dhaka",
    },
    productName: `${offering?.investment_plans?.name_en ?? "Krishi investment"} (${interest.reference})`,
    productCategory: "Livestock investment",
  });

  if (!result.ok) {
    await db.from("online_payments").update({ status: "failed", failure_reason: result.error }).eq("id", payment.id);
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  await db.from("online_payments").update({ session_key: result.sessionKey }).eq("id", payment.id);
  return NextResponse.json({ url: result.gatewayUrl });
}
