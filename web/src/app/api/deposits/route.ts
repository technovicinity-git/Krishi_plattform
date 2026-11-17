import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";

export const runtime = "nodejs";

const schema = z.object({
  interest_id: z.string().uuid(),
  amount: z.coerce.number().positive(),
  method: z.enum(["bank", "mfs"]),
  txn_id: z.string().optional().nullable().or(z.literal("")),
  sender_number: z.string().optional().nullable().or(z.literal("")),
  deposit_date: z.string(),
  note: z.string().optional().nullable().or(z.literal("")),
  proof_path: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "investor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    console.error("[deposits POST] validation error:", parsed.error.issues);
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  if (parsed.data.method === "bank" && !parsed.data.txn_id) {
    return NextResponse.json({ error: "Transaction ID is required for bank transfers" }, { status: 400 });
  }
  if (parsed.data.method === "mfs" && !parsed.data.sender_number) {
    return NextResponse.json({ error: "Sender number is required for mobile wallets" }, { status: 400 });
  }

  const db = createAdminClient();

  const { data: interest } = await db
    .from("investment_interests")
    .select("id, status")
    .eq("id", parsed.data.interest_id)
    .eq("investor_id", user.id)
    .maybeSingle();

  if (!interest || interest.status !== "approved") {
    return NextResponse.json({ error: "Invalid interest or not approved" }, { status: 400 });
  }

  const { data, error } = await db.from("deposits").insert({
    investor_id: user.id,
    interest_id: parsed.data.interest_id,
    amount: parsed.data.amount,
    method: parsed.data.method,
    txn_id: parsed.data.txn_id || null,
    sender_number: parsed.data.sender_number || null,
    deposit_date: parsed.data.deposit_date,
    note: parsed.data.note || null,
    proof_path: parsed.data.proof_path || null,
  }).select("id, reference").single();

  if (error) {
    console.error("[deposits POST] insert error:", error);
    return NextResponse.json({ error: "Failed to submit deposit" }, { status: 500 });
  }

  await db.from("investment_interests")
    .update({ status: "onboarding" })
    .eq("id", interest.id);

  return NextResponse.json({ success: true, reference: data.reference });
}