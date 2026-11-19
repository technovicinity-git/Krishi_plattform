import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { uploadUpdatePhoto } from "@/lib/investments/photos";
import { timeline } from "@/lib/investments/timeline";

export const runtime = "nodejs";

const schema = z
  .object({
    method: z.enum(["bank", "mfs", "cash"]),
    txn_id: z.string().trim().max(80).optional().default(""),
    sender: z.string().trim().max(80).optional().default(""),
    note: z.string().trim().max(1000).optional().default(""),
  })
  .refine((d) => d.method === "cash" || d.txn_id.length > 0, {
    message: "Transaction ID is required for bank and mobile transfers",
  });

/**
 * Farmer reports that the sale money was sent to Krishi.
 * Sale status awaiting_remittance -> remittance_submitted (admin confirms).
 * Body: multipart form (method, txn_id, sender, note, proof).
 * A proof image is required for bank and mobile transfers.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "farmer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const parsed = schema.safeParse({
    method: form.get("method"),
    txn_id: form.get("txn_id") ?? undefined,
    sender: form.get("sender") ?? undefined,
    note: form.get("note") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const data = parsed.data;

  const db = createAdminClient();
  const { data: sale } = await db
    .from("investment_sales")
    .select("id, investment_id, sale_amount, status, reference")
    .eq("investment_id", id)
    .eq("farmer_id", user.id)
    .maybeSingle();

  if (!sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 });
  if (sale.status !== "awaiting_remittance") {
    return NextResponse.json(
      { error: "This sale is not waiting for the money to be sent" },
      { status: 400 },
    );
  }

  const proofField = form.get("proof");
  const hasProof = proofField && typeof proofField !== "string" && proofField.size > 0;
  if (data.method !== "cash" && !hasProof) {
    return NextResponse.json({ error: "Upload a screenshot or photo of the transfer" }, { status: 400 });
  }
  const proof = await uploadUpdatePhoto(proofField, sale.investment_id, "remittances");
  if (!proof.ok) return NextResponse.json({ error: proof.error }, { status: 400 });

  const { data: updated, error } = await db
    .from("investment_sales")
    .update({
      status: "remittance_submitted",
      remit_method: data.method,
      remit_txn_id: data.txn_id || null,
      remit_sender: data.sender || null,
      remit_note: data.note || null,
      remit_proof_path: proof.path,
      remitted_at: new Date().toISOString(),
      remit_rejection_reason: null,
    })
    .eq("id", sale.id)
    .eq("status", "awaiting_remittance")
    .select("id");

  if (error) {
    console.error("[farmer/remit] update failed:", error);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
  if (!updated?.length) {
    return NextResponse.json({ error: "Already submitted" }, { status: 409 });
  }

  const amount = Number(sale.sale_amount);
  await db.from("investment_updates").insert({
    investment_id: sale.investment_id,
    author_id: user.id,
    author_role: "farmer",
    update_type: "sale",
    title: "Sale money sent to Krishi",
    body:
      data.note ||
      `Sent ৳${amount.toLocaleString("en-IN")} to Krishi${data.txn_id ? ` (Txn ${data.txn_id})` : ""}. Waiting for admin confirmation.`,
    amount,
    metadata: {
      reference: sale.reference,
      method: data.method,
      i18n: timeline("remitted", { amount, ...(data.txn_id ? { txn: data.txn_id } : {}) }, data.note),
    },
  });

  return NextResponse.json({ success: true });
}
