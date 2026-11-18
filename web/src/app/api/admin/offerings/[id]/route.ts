import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/lib/admin/current-admin";
import { logAdminAction } from "@/lib/admin/audit";
import { notifyOfferingChange } from "@/lib/notifications/notify";

export const runtime = "nodejs";

const patchSchema = z.object({
  units_offered: z.coerce.number().int().min(1).max(1000).optional(),
  thana_id: z.string().uuid().nullable().optional(),
  status: z
    .enum(["pending_approval", "approved", "paused", "closed", "rejected"])
    .optional(),
  rejection_reason: z.string().max(500).nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = createAdminClient();

  const { data: existing } = await db
    .from("steward_plan_offerings")
    .select("id, units_funded, units_offered, status")
    .eq("id", id)
    .maybeSingle();
  if (!existing) {
    return NextResponse.json({ error: "Offering not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const updates: Record<string, unknown> = {};

  if (parsed.data.units_offered !== undefined) {
    if (parsed.data.units_offered < existing.units_funded) {
      return NextResponse.json(
        {
          error: `Cannot reduce below already-funded units (${existing.units_funded})`,
        },
        { status: 400 },
      );
    }
    updates.units_offered = parsed.data.units_offered;
  }

  if (parsed.data.thana_id !== undefined) {
    updates.thana_id = parsed.data.thana_id;
  }

  if (parsed.data.status !== undefined) {
    updates.status = parsed.data.status;
    if (parsed.data.status === "approved") {
      updates.approved_by = admin.id;
      updates.approved_at = new Date().toISOString();
    }
    if (parsed.data.status === "rejected") {
      updates.rejection_reason = parsed.data.rejection_reason ?? null;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ success: true });
  }

  const { error } = await db
    .from("steward_plan_offerings")
    .update(updates)
    .eq("id", id);

  if (error) {
    console.error("[offerings PATCH] update failed:", error);
    return NextResponse.json({ error: "Failed to update offering" }, { status: 500 });
  }

  await logAdminAction({
    adminId: admin.id,
    action: "offering.update",
    targetType: "steward_plan_offering",
    targetId: id,
    metadata: updates,
    request,
  });

  // Tell the steward what changed: a new status wins over a units change.
  const newStatus = parsed.data.status;
  if (newStatus && newStatus !== existing.status) {
    const kind = (
      {
        approved: "offering_approved",
        paused: "offering_paused",
        closed: "offering_closed",
        rejected: "offering_rejected",
      } as const
    )[newStatus as "approved" | "paused" | "closed" | "rejected"];
    if (kind) await notifyOfferingChange(id, kind, { reason: parsed.data.rejection_reason });
  } else if (
    parsed.data.units_offered !== undefined &&
    parsed.data.units_offered !== existing.units_offered
  ) {
    await notifyOfferingChange(id, "offering_units");
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = createAdminClient();

  const { data: existing } = await db
    .from("steward_plan_offerings")
    .select("id, units_funded")
    .eq("id", id)
    .maybeSingle();
  if (!existing) {
    return NextResponse.json({ error: "Offering not found" }, { status: 404 });
  }

  if (existing.units_funded > 0) {
    return NextResponse.json(
      { error: "Cannot close an offering that has funded units" },
      { status: 400 },
    );
  }

  const { error } = await db
    .from("steward_plan_offerings")
    .update({ status: "closed" })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Failed to close offering" }, { status: 500 });
  }

  await logAdminAction({
    adminId: admin.id,
    action: "offering.close",
    targetType: "steward_plan_offering",
    targetId: id,
    request,
  });

  await notifyOfferingChange(id, "offering_closed");

  return NextResponse.json({ success: true });
}