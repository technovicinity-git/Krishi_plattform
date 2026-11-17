import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";

export const runtime = "nodejs";

const schema = z.object({
  investment_id: z.string().uuid(),
  amount: z.coerce.number().positive(),
  purpose: z.enum(["animal_purchase", "feed", "medical", "transport", "other"]),
  note: z.string().optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "farmer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const db = createAdminClient();

  // Verify investment belongs to this farmer
  const { data: inv } = await db
    .from("investments")
    .select("id, farmer_id, current_stage")
    .eq("id", parsed.data.investment_id)
    .eq("farmer_id", user.id)
    .maybeSingle();

  if (!inv) {
    return NextResponse.json({ error: "Investment not found" }, { status: 404 });
  }

  // Create the fund request
  const { data: fundReq, error } = await db
    .from("fund_requests")
    .insert({
      investment_id: inv.id,
      farmer_id: user.id,
      amount: parsed.data.amount,
      purpose: parsed.data.purpose,
      status: "pending",
    })
    .select("id, reference")
    .single();

  if (error) {
    console.error("[farmer/fund-requests] error:", error);
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }

  // Log to timeline
  await db.from("investment_updates").insert({
    investment_id: inv.id,
    author_id: user.id,
    author_role: "farmer",
    update_type: "fund_request",
    title: `Fund Request: ${parsed.data.purpose.replace(/_/g, " ")}`,
    body: parsed.data.note || `Requested ৳${parsed.data.amount.toLocaleString("en-IN")} for ${parsed.data.purpose}.`,
    amount: parsed.data.amount,
  });

  return NextResponse.json({ success: true, reference: fundReq.reference });
}