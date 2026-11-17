import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";

export const runtime = "nodejs";

const schema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "steward") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = createAdminClient();

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  // Fetch request and verify ownership via investment -> offering -> steward
  const { data: fundReq } = await db
    .from("fund_requests")
    .select(`
      id, investment_id, amount, purpose, status,
      investment:investments!investment_id (
        offering:steward_plan_offerings!offering_id ( steward_id )
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (!fundReq) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  
  const stewardId = (
    fundReq.investment as unknown as { offering: { steward_id: string } | null } | null
  )?.offering?.steward_id;
  if (stewardId !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (fundReq.status !== "pending") {
    return NextResponse.json({ error: "Request already processed" }, { status: 400 });
  }

  const isApproved = parsed.data.action === "approve";

  // Update request
  const { error } = await db
    .from("fund_requests")
    .update({
      status: isApproved ? "approved" : "rejected",
      rejection_reason: isApproved ? null : (parsed.data.reason || "No reason provided"),
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: "Failed to update" }, { status: 500 });

  // Log to timeline
  await db.from("investment_updates").insert({
    investment_id: fundReq.investment_id,
    author_id: user.id,
    author_role: "steward",
    update_type: isApproved ? "fund_disbursed" : "note",
    title: isApproved ? `Funds Approved: ${fundReq.purpose.replace(/_/g, " ")}` : `Fund Request Rejected`,
    body: isApproved 
      ? `Approved ৳${fundReq.amount.toLocaleString("en-IN")} for ${fundReq.purpose}.` 
      : `Rejected request for ${fundReq.purpose}. Reason: ${parsed.data.reason || "None"}`,
    amount: isApproved ? fundReq.amount : null,
  });

  return NextResponse.json({ success: true });
}