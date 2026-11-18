import { createAdminClient } from "@/lib/supabase/admin";
import { approveDeposit } from "@/lib/deposits/approve";
import { validate } from "./sslcommerz";

export type CompleteResult =
  | { state: "paid"; locale: string; interestReference: string; investmentId: string | null }
  | { state: "review"; locale: string; interestReference: string }
  | { state: "failed"; locale: string; interestReference: string | null; reason: string };

/**
 * Finishes an SSLCommerz payment after the gateway calls back (browser
 * redirect or IPN). Validates with SSLCommerz, checks it matches what we
 * asked for, then records the deposit and starts the investment.
 * Safe to call more than once for the same payment. Server-only.
 */
export async function completeOnlinePayment(tranId: string, valId: string): Promise<CompleteResult> {
  const db = createAdminClient();
  const { data: payment } = await db
    .from("online_payments")
    .select("id, tran_id, amount, currency, status, locale, interest_id, investor_id, deposit_id, interest:investment_interests!interest_id ( reference )")
    .eq("tran_id", tranId)
    .maybeSingle();
  if (!payment) return { state: "failed", locale: "bn", interestReference: null, reason: "Unknown transaction" };

  const interestReference = (payment.interest as unknown as { reference: string } | null)?.reference ?? null;
  const locale = payment.locale;

  // Already handled (e.g. IPN arrived before the browser redirect).
  if (payment.status === "paid") {
    return finished(payment.deposit_id, locale, interestReference ?? "");
  }
  if (payment.status !== "initiated") {
    return { state: "failed", locale, interestReference, reason: "This payment was not completed" };
  }

  const v = await validate(valId);
  const fail = async (reason: string, status: "invalid" | "failed" = "invalid"): Promise<CompleteResult> => {
    await db
      .from("online_payments")
      .update({ status, failure_reason: reason, validation: v, val_id: valId })
      .eq("id", payment.id)
      .eq("status", "initiated");
    return { state: "failed", locale, interestReference, reason };
  };

  if (!v) return { state: "failed", locale, interestReference, reason: "Could not confirm the payment with SSLCommerz" };
  if (v.status !== "VALID" && v.status !== "VALIDATED") return fail(`Gateway status ${v.status}`);
  if (v.tran_id !== payment.tran_id) return fail("Transaction ID does not match");
  // Compare in BDT; SSLCommerz reports the BDT amount in `amount`.
  if (v.currency_type && v.currency_type !== "BDT") return fail("Currency does not match");
  if (Math.abs(Number(v.amount) - Number(payment.amount)) > 0.01) return fail("Amount does not match");

  // Claim the payment so a parallel IPN/redirect can't create a second deposit.
  const { data: claimed } = await db
    .from("online_payments")
    .update({
      status: "paid",
      val_id: valId,
      bank_tran_id: v.bank_tran_id ?? null,
      card_type: v.card_type ?? null,
      card_brand: v.card_brand ?? null,
      gateway_status: v.status,
      validation: v,
      paid_at: new Date().toISOString(),
    })
    .eq("id", payment.id)
    .eq("status", "initiated")
    .select("id");
  if (!claimed?.length) {
    const { data: again } = await db.from("online_payments").select("deposit_id").eq("id", payment.id).maybeSingle();
    return finished(again?.deposit_id ?? null, locale, interestReference ?? "");
  }

  // Record the deposit (the money is with Krishi now).
  const { data: deposit, error } = await db
    .from("deposits")
    .insert({
      investor_id: payment.investor_id,
      interest_id: payment.interest_id,
      amount: payment.amount,
      method: "online",
      txn_id: v.bank_tran_id ?? payment.tran_id,
      sender_number: v.card_type ?? null,
      deposit_date: new Date().toISOString().slice(0, 10),
      note: `Paid online via SSLCommerz (${payment.tran_id}${v.card_type ? `, ${v.card_type}` : ""})`,
      status: "pending",
    })
    .select("id")
    .single();
  if (error || !deposit) {
    // Money was taken but we couldn't record it: keep the payment row for admin follow-up.
    console.error("[completeOnlinePayment] deposit insert failed:", error);
    await db.from("online_payments").update({ failure_reason: "Paid, but the deposit could not be recorded" }).eq("id", payment.id);
    return { state: "review", locale, interestReference: interestReference ?? "" };
  }
  await db.from("online_payments").update({ deposit_id: deposit.id }).eq("id", payment.id);
  await db.from("investment_interests").update({ status: "onboarding" }).eq("id", payment.interest_id).eq("status", "approved");

  // A risky payment (per SSLCommerz) is left for an admin to approve by hand.
  if (v.risk_level === "1") {
    await db.from("online_payments").update({ failure_reason: `Held for review: ${v.risk_title ?? "risky payment"}` }).eq("id", payment.id);
    return { state: "review", locale, interestReference: interestReference ?? "" };
  }

  const approved = await approveDeposit(deposit.id, null);
  if (!approved.ok) {
    // E.g. units sold out meanwhile: the deposit stays pending in the admin queue.
    await db.from("online_payments").update({ failure_reason: `Paid; needs admin review: ${approved.error}` }).eq("id", payment.id);
    return { state: "review", locale, interestReference: interestReference ?? "" };
  }
  return { state: "paid", locale, interestReference: interestReference ?? "", investmentId: approved.investmentId };
}

/** Result for a payment that was already completed: did it start an investment? */
async function finished(depositId: string | null, locale: string, interestReference: string): Promise<CompleteResult> {
  if (!depositId) return { state: "review", locale, interestReference };
  const db = createAdminClient();
  const { data: deposit } = await db.from("deposits").select("interest_id, status").eq("id", depositId).maybeSingle();
  if (!deposit || deposit.status !== "approved") return { state: "review", locale, interestReference };
  const { data: investment } = await db
    .from("investments")
    .select("id")
    .eq("interest_id", deposit.interest_id)
    .maybeSingle();
  return investment
    ? { state: "paid", locale, interestReference, investmentId: investment.id }
    : { state: "review", locale, interestReference };
}
