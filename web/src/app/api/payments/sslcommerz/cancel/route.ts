import { createAdminClient } from "@/lib/supabase/admin";
import { readGatewayFields } from "@/lib/payments/callback";
import { appBaseUrl, localePath } from "@/lib/payments/urls";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * SSLCommerz sends the browser here when the payment was cancelled.
 * Only an "initiated" payment can be closed, so this can't undo a paid one.
 */
async function handle(request: Request) {
  const f = await readGatewayFields(request);
  const base = appBaseUrl(request);
  if (!f.tran_id) return Response.redirect(`${base}/portal/interests?payment=cancel`, 303);

  const db = createAdminClient();
  const { data } = await db
    .from("online_payments")
    .update({ status: "cancelled", gateway_status: f.status ?? null, failure_reason: f.error ?? null })
    .eq("tran_id", f.tran_id)
    .eq("status", "initiated")
    .select("locale, interest:investment_interests!interest_id ( reference )");
  const row = data?.[0];
  const { data: existing } = row
    ? { data: null }
    : await db.from("online_payments").select("locale, interest:investment_interests!interest_id ( reference )").eq("tran_id", f.tran_id).maybeSingle();
  const info = row ?? existing;
  const locale = info?.locale ?? "bn";
  const reference = (info?.interest as unknown as { reference: string } | null)?.reference;

  return Response.redirect(
    `${base}${localePath(locale, reference ? `/onboarding/${reference}?payment=cancel` : "/portal/interests?payment=cancel")}`,
    303,
  );
}

export const POST = handle;
export const GET = handle;
