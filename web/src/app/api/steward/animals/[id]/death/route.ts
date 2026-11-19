import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { investmentRoleFor } from "@/lib/investments/access";
import { notify, investmentParties } from "@/lib/notifications/notify";
import { timeline } from "@/lib/investments/timeline";

export const runtime = "nodejs";

const schema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().trim().max(500).optional().default(""),
});

/**
 * Steward confirms or rejects a death the farmer reported.
 * approve: animal -> dead (date and cause from the report).
 * reject:  animal -> active again; the farmer is told why.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "steward") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { action, reason } = parsed.data;
  if (action === "reject" && !reason) {
    return NextResponse.json({ error: "Give a reason" }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: animal } = await db
    .from("animals")
    .select("id, investment_id, tag, status")
    .eq("id", id)
    .maybeSingle();
  if (!animal) return NextResponse.json({ error: "Animal not found" }, { status: 404 });

  const access = await investmentRoleFor(user, animal.investment_id);
  if (access?.role !== "steward") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { data: report } = await db
    .from("animal_records")
    .select("id, recorded_on, note")
    .eq("animal_id", animal.id)
    .eq("kind", "death")
    .eq("review_status", "pending")
    .maybeSingle();
  if (animal.status !== "death_reported" || !report) {
    return NextResponse.json({ error: "There is no death report waiting for review" }, { status: 409 });
  }

  const approve = action === "approve";
  const now = new Date().toISOString();

  // Claim the report so a double click can't apply it twice.
  const { data: reviewed, error } = await db
    .from("animal_records")
    .update({
      review_status: approve ? "approved" : "rejected",
      reviewed_by: user.id,
      reviewed_at: now,
      rejection_reason: approve ? null : reason,
    })
    .eq("id", report.id)
    .eq("review_status", "pending")
    .select("id");
  if (error) {
    console.error("[steward/animal death] review failed:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
  if (!reviewed?.length) {
    return NextResponse.json({ error: "Already reviewed" }, { status: 409 });
  }

  await db
    .from("animals")
    .update(
      approve
        ? { status: "dead", died_at: report.recorded_on }
        : { status: "active", death_cause: null },
    )
    .eq("id", animal.id)
    .eq("status", "death_reported");

  await db.from("investment_updates").insert({
    investment_id: animal.investment_id,
    author_id: user.id,
    author_role: "steward",
    update_type: approve ? "health_check" : "note",
    title: approve ? `Animal ${animal.tag} died` : `Death report not accepted: animal ${animal.tag}`,
    body: approve ? report.note : `Reason: ${reason}`,
    metadata: {
      i18n: approve
        ? timeline("animal_died", { tag: animal.tag }, report.note)
        : timeline("death_rejected", { tag: animal.tag, reason }),
    },
  });

  const parties = await investmentParties(animal.investment_id);
  if (parties) {
    const base = { reference: parties.reference, plan: parties.plan, planBn: parties.planBn, name: animal.tag };
    if (approve) {
      await notify("animal_died", [
        { userId: parties.investorId, href: `/portal/investments/${animal.investment_id}` },
        { userId: parties.farmerId, href: `/farmer/investments/${animal.investment_id}` },
      ], { ...base, reason: report.note ?? undefined });
    } else {
      await notify(
        "animal_death_rejected",
        { userId: parties.farmerId, href: `/farmer/investments/${animal.investment_id}` },
        { ...base, reason },
      );
    }
  }

  return NextResponse.json({ success: true });
}
