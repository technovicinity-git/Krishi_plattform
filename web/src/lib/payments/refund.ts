import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notifications/notify";
import { initiateRefund, refundStatus } from "./sslcommerz";

/**
 * Refunds for paid online payments that did not become an investment.
 * See supabase/migrations/20261119000004_online_refunds.sql. Server-only.
 */

export type RefundMethod = "gateway" | "manual";

export type RefundOutcome =
  | { ok: true; status: "refund_pending" | "refunded" }
  | { ok: false; error: string; status?: number };

/**
 * Refunds a paid payment.
 * - gateway: asks SSLCommerz; the payment stays refund_pending until
 *   checkRefund() sees it refunded.
 * - manual: the admin already returned the money (reference = transfer ID).
 * In both cases the deposit becomes 'refunded' and the interest is cancelled,
 * or reopened for payment when allowRetry is set. The investor is notified.
 */
export async function refundPayment(input: {
  paymentId: string;
  adminId: string;
  method: RefundMethod;
  reason: string;
  reference?: string;
  allowRetry?: boolean;
}): Promise<RefundOutcome> {
  const db = createAdminClient();
  const { data: payment } = await db
    .from("online_payments")
    .select("id, tran_id, bank_tran_id, amount, status, interest_id, investor_id, deposit_id")
    .eq("id", input.paymentId)
    .maybeSingle();
  if (!payment) return { ok: false, error: "Payment not found", status: 404 };
  if (payment.status !== "paid") {
    return { ok: false, error: "Only a paid payment that wasn't refunded can be refunded", status: 409 };
  }

  // A payment that already started an investment can't simply be refunded.
  if (payment.deposit_id) {
    const { data: deposit } = await db.from("deposits").select("status").eq("id", payment.deposit_id).maybeSingle();
    if (deposit?.status === "approved") {
      return { ok: false, error: "This payment was approved and started an investment", status: 409 };
    }
  }
  if (input.method === "gateway" && !payment.bank_tran_id) {
    return { ok: false, error: "SSLCommerz didn't give a bank transaction ID; refund it manually", status: 400 };
  }

  const amount = Number(payment.amount);
  const now = new Date().toISOString();

  // Claim the payment first so a double click can't refund twice.
  const { data: claimed } = await db
    .from("online_payments")
    .update({
      status: input.method === "gateway" ? "refund_pending" : "refunded",
      refund_method: input.method,
      refund_amount: amount,
      refund_reason: input.reason,
      refund_reference: input.reference ?? null,
      refund_requested_at: now,
      refunded_at: input.method === "manual" ? now : null,
      refunded_by: input.adminId,
    })
    .eq("id", payment.id)
    .eq("status", "paid")
    .select("id");
  if (!claimed?.length) return { ok: false, error: "This payment is already being refunded", status: 409 };

  if (input.method === "gateway") {
    const result = await initiateRefund({
      bankTranId: payment.bank_tran_id!,
      tranId: payment.tran_id,
      amount,
      remarks: input.reason,
    });
    if (result.status !== "success" && result.status !== "processing") {
      // Give the payment back so the admin can try again or refund manually.
      await db
        .from("online_payments")
        .update({
          status: "paid",
          refund_method: null,
          refund_amount: null,
          refund_requested_at: null,
          refunded_by: null,
          refund_response: result.raw,
        })
        .eq("id", payment.id);
      return { ok: false, error: result.error ?? "SSLCommerz refused the refund", status: 502 };
    }
    await db
      .from("online_payments")
      .update({ refund_ref_id: result.refundRefId, refund_response: result.raw })
      .eq("id", payment.id);
  }

  // The deposit and interest are settled now: the money is on its way back.
  if (payment.deposit_id) {
    await db
      .from("deposits")
      .update({ status: "refunded", rejection_reason: input.reason, reviewed_at: now, reviewed_by: input.adminId })
      .eq("id", payment.deposit_id)
      .eq("status", "pending");
  }
  await db
    .from("investment_interests")
    .update({ status: input.allowRetry ? "approved" : "cancelled" })
    .eq("id", payment.interest_id)
    .in("status", ["approved", "onboarding"]);

  const { data: interest } = await db
    .from("investment_interests")
    .select("reference")
    .eq("id", payment.interest_id)
    .maybeSingle();
  await notify(
    input.method === "gateway" ? "payment_refund_started" : "payment_refunded",
    { userId: payment.investor_id, href: "/portal/interests" },
    { reference: interest?.reference ?? payment.tran_id, amount, reason: input.reason },
  );

  return { ok: true, status: input.method === "gateway" ? "refund_pending" : "refunded" };
}

/** Asks SSLCommerz whether a pending gateway refund has gone through. */
export async function checkRefund(paymentId: string): Promise<
  { ok: true; status: "refund_pending" | "refunded"; gatewayStatus: string } | { ok: false; error: string; status?: number }
> {
  const db = createAdminClient();
  const { data: payment } = await db
    .from("online_payments")
    .select("id, status, refund_ref_id, refund_amount, investor_id, interest_id, tran_id")
    .eq("id", paymentId)
    .maybeSingle();
  if (!payment) return { ok: false, error: "Payment not found", status: 404 };
  if (payment.status !== "refund_pending") return { ok: false, error: "No refund is waiting for this payment", status: 409 };
  if (!payment.refund_ref_id) return { ok: false, error: "SSLCommerz didn't return a refund reference", status: 400 };

  const result = await refundStatus(payment.refund_ref_id);
  await db.from("online_payments").update({ refund_response: result.raw }).eq("id", payment.id);
  if (result.status !== "refunded") {
    if (result.status === "failed" && result.error) return { ok: false, error: result.error, status: 502 };
    return { ok: true, status: "refund_pending", gatewayStatus: result.status };
  }

  const { data: done } = await db
    .from("online_payments")
    .update({ status: "refunded", refunded_at: new Date().toISOString() })
    .eq("id", payment.id)
    .eq("status", "refund_pending")
    .select("id");
  if (done?.length) {
    const { data: interest } = await db.from("investment_interests").select("reference").eq("id", payment.interest_id).maybeSingle();
    await notify(
      "payment_refunded",
      { userId: payment.investor_id, href: "/portal/interests" },
      { reference: interest?.reference ?? payment.tran_id, amount: Number(payment.refund_amount) },
    );
  }
  return { ok: true, status: "refunded", gatewayStatus: result.status };
}
