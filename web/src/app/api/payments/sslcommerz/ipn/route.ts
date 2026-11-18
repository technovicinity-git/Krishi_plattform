import { completeOnlinePayment } from "@/lib/payments/complete";
import { readGatewayFields } from "@/lib/payments/callback";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Instant Payment Notification: SSLCommerz calls this server-to-server,
 * so a payment is recorded even if the customer closes the browser before
 * being redirected back. Needs a public URL (it can't reach localhost).
 */
export async function POST(request: Request) {
  const f = await readGatewayFields(request);
  if (!f.tran_id || !f.val_id || (f.status !== "VALID" && f.status !== "VALIDATED")) {
    return Response.json({ received: true });
  }
  const result = await completeOnlinePayment(f.tran_id, f.val_id);
  return Response.json({ received: true, state: result.state });
}
