import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/lib/admin/current-admin";
import { logAdminAction } from "@/lib/admin/audit";
import { notifyOfferingChange } from "@/lib/notifications/notify";
import type { OfferingQueryRow } from "@/lib/admin/plan-helpers";

export const runtime = "nodejs";

const createSchema = z.object({
  steward_id: z.string().uuid(),
  thana_id: z.string().uuid().nullable().optional(),
  units_offered: z.coerce.number().int().min(1).max(1000),
  status: z.enum(["pending_approval", "approved"]).default("approved"),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = createAdminClient();

  const { data, error } = await db
    .from("steward_plan_offerings")
    .select(
      `
      id, units_offered, units_funded, status, approved_at, rejection_reason, created_at,
      thana_id,
      thanas ( name_en, name_bn ),
      users!steward_id!inner ( id, full_name )
      `,
    )
    .eq("plan_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[offerings GET] error:", error);
    return NextResponse.json({ error: "Failed to load offerings" }, { status: 500 });
  }

  const items = ((data ?? []) as unknown as OfferingQueryRow[]).map((row) => ({
    id: row.id,
    steward_id: row.users?.id ?? null,
    steward_name: row.users?.full_name ?? "—",
    thana_id: row.thana_id,
    thana_name: row.thanas?.name_en ?? null,
    units_offered: row.units_offered,
    units_funded: row.units_funded,
    status: row.status,
    approved_at: row.approved_at,
    rejection_reason: row.rejection_reason,
  }));

  return NextResponse.json({ items });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = createAdminClient();

  const { data: plan } = await db
    .from("investment_plans")
    .select("id, district_id")
    .eq("id", id)
    .maybeSingle();
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { data: steward } = await db
    .from("users")
    .select("id")
    .eq("id", parsed.data.steward_id)
    .eq("role", "steward")
    .eq("status", "active")
    .eq("steward_approval_status", "approved")
    .maybeSingle();
  if (!steward) {
    return NextResponse.json({ error: "Steward is not approved or active" }, { status: 400 });
  }

  if (parsed.data.thana_id) {
    const { data: thana } = await db
      .from("thanas")
      .select("id, district_id")
      .eq("id", parsed.data.thana_id)
      .maybeSingle();
    if (!thana || thana.district_id !== plan.district_id) {
      return NextResponse.json(
        { error: "Thana does not belong to the plan's district" },
        { status: 400 },
      );
    }
  }

  const { data: existing } = await db
    .from("steward_plan_offerings")
    .select("id")
    .eq("plan_id", id)
    .eq("steward_id", parsed.data.steward_id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { error: "This steward already offers this plan" },
      { status: 409 },
    );
  }

  const isApproved = parsed.data.status === "approved";
  const { data, error } = await db
    .from("steward_plan_offerings")
    .insert({
      plan_id: id,
      steward_id: parsed.data.steward_id,
      thana_id: parsed.data.thana_id ?? null,
      units_offered: parsed.data.units_offered,
      status: isApproved ? "approved" : "pending_approval",
      approved_by: isApproved ? admin.id : null,
      approved_at: isApproved ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[offerings POST] insert failed:", error);
    return NextResponse.json({ error: "Failed to create offering" }, { status: 500 });
  }

  await logAdminAction({
    adminId: admin.id,
    action: "offering.create",
    targetType: "steward_plan_offering",
    targetId: data.id,
    metadata: { plan_id: id, steward_id: parsed.data.steward_id },
    request,
  });

  await notifyOfferingChange(data.id, isApproved ? "offering_assigned" : "offering_assigned_pending");

  return NextResponse.json({ success: true, id: data.id });
}