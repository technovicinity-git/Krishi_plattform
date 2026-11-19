import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { uploadPrivateImage } from "@/lib/storage/private-files";
import { notifyAdmins } from "@/lib/notifications/notify";

export const runtime = "nodejs";

const schema = z.object({
  interest_id: z.string().uuid(),
  method: z.enum(["bank", "mfs"]),
  txn_id: z.string().trim().max(80).optional().default(""),
  sender_number: z.string().trim().max(30).optional().default(""),
  deposit_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid deposit date"),
  note: z.string().trim().max(1000).optional().default(""),
});

/**
 * Investor reports a deposit for an approved interest.
 * Body: multipart form (interest_id, method, txn_id, sender_number,
 * deposit_date, note, proof?). The proof image is uploaded here, server-side,
 * to private storage. The amount is worked out from the plan, not taken
 * from the browser.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "investor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const parsed = schema.safeParse({
    interest_id: form.get("interest_id"),
    method: form.get("method"),
    txn_id: form.get("txn_id") ?? undefined,
    sender_number: form.get("sender_number") ?? undefined,
    deposit_date: form.get("deposit_date"),
    note: form.get("note") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const data = parsed.data;

  if (data.method === "bank" && !data.txn_id) {
    return NextResponse.json({ error: "Transaction ID is required for bank transfers" }, { status: 400 });
  }
  if (data.method === "mfs" && !data.sender_number) {
    return NextResponse.json({ error: "Sender number is required for mobile wallets" }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: interest } = await db
    .from("investment_interests")
    .select(`
      id, status, requested_units,
      offering:steward_plan_offerings!offering_id ( investment_plans ( unit_price ) )
    `)
    .eq("id", data.interest_id)
    .eq("investor_id", user.id)
    .maybeSingle();

  if (!interest || interest.status !== "approved") {
    return NextResponse.json({ error: "Invalid interest or not approved" }, { status: 400 });
  }

  const unitPrice = Number(
    (interest.offering as unknown as { investment_plans: { unit_price: number | string } | null } | null)
      ?.investment_plans?.unit_price ?? 0,
  );
  const amount = unitPrice * interest.requested_units;
  if (!(amount > 0)) {
    return NextResponse.json({ error: "This plan has no unit price set" }, { status: 400 });
  }

  const proof = await uploadPrivateImage(form.get("proof"), `deposits/${interest.id}`);
  if (!proof.ok) return NextResponse.json({ error: proof.error }, { status: 400 });

  const { data: deposit, error } = await db
    .from("deposits")
    .insert({
      investor_id: user.id,
      interest_id: interest.id,
      amount,
      method: data.method,
      txn_id: data.txn_id || null,
      sender_number: data.sender_number || null,
      deposit_date: data.deposit_date,
      note: data.note || null,
      proof_path: proof.path,
    })
    .select("id, reference")
    .single();

  if (error) {
    console.error("[deposits POST] insert error:", error);
    return NextResponse.json({ error: "Failed to submit deposit" }, { status: 500 });
  }

  await db.from("investment_interests").update({ status: "onboarding" }).eq("id", interest.id);
  await notifyAdmins("admin_deposit_submitted", "/krishi-console/deposits", {
    name: user.fullName ?? user.phone ?? "An investor",
    amount,
    reference: deposit.reference,
  });

  return NextResponse.json({ success: true, reference: deposit.reference });
}
