import { completeOnlinePayment } from "@/lib/payments/complete";
import { readGatewayFields } from "@/lib/payments/callback";
import { appBaseUrl, localePath } from "@/lib/payments/urls";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * SSLCommerz sends the customer's browser here (form POST) after paying.
 * The posted fields are not trusted: completeOnlinePayment() re-checks the
 * payment with SSLCommerz before anything is recorded.
 */
async function handle(request: Request) {
  const f = await readGatewayFields(request);
  const base = appBaseUrl(request);
  if (!f.tran_id || !f.val_id) {
    return Response.redirect(`${base}/portal/interests?payment=failed`, 303);
  }

  const result = await completeOnlinePayment(f.tran_id, f.val_id);
  const go = (path: string) => Response.redirect(`${base}${localePath(result.locale, path)}`, 303);

  if (result.state === "paid" && result.investmentId) {
    return go(`/portal/investments/${result.investmentId}?payment=success`);
  }
  if (result.state === "review") return go(`/portal/interests?payment=review`);
  return go(result.interestReference ? `/onboarding/${result.interestReference}?payment=failed` : `/portal/interests?payment=failed`);
}

export const POST = handle;
export const GET = handle;
