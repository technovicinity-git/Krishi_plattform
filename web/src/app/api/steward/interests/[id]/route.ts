import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { notify } from "@/lib/notifications/notify";

export const runtime = "nodejs";

const schema = z.object({
  action: z.enum(["approve", "reject"]),
  rejection_reason: z.string().max(500).optional(),
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

  const { data: interest } = await db
    .from("investment_interests")
    .select(`
      id, status, requested_units, reference, investor_id,
      offering:steward_plan_offerings!offering_id ( id, steward_id, investment_plans ( name_en, name_bn ) )
    `)
    .eq("id", id)
    .maybeSingle();

  if (!interest) return NextResponse.json({ error: "Interest not found" }, { status: 404 });
  
  const offering = interest.offering as unknown as {
    steward_id: string;
    investment_plans: { name_en: string | null; name_bn: string | null } | null;
  } | null;
  const planParams = {
    reference: interest.reference,
    plan: offering?.investment_plans?.name_en ?? undefined,
    planBn: offering?.investment_plans?.name_bn ?? undefined,
  };
  if (offering?.steward_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (interest.status !== "submitted" && interest.status !== "under_review") {
    return NextResponse.json({ error: "Interest already processed" }, { status: 400 });
  }

  if (parsed.data.action === "reject") {
    await db.from("investment_interests").update({
      status: "not_approved",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: parsed.data.rejection_reason || "No reason provided",
    }).eq("id", id);
    await notify(
      "interest_declined",
      { userId: interest.investor_id, href: "/portal/interests" },
      { ...planParams, reason: parsed.data.rejection_reason || undefined },
    );
    return NextResponse.json({ success: true });
  }

  // Just update status to approved. Do NOT reserve units yet.
  await db.from("investment_interests").update({
    status: "approved",
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
  }).eq("id", id);

  await notify(
    "interest_approved",
    { userId: interest.investor_id, href: `/onboarding/${interest.reference}` },
    planParams,
  );

  return NextResponse.json({ success: true });
}