import { NextResponse } from "next/server";
import { requireMobileUser, json } from "@/lib/mobile/api";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Steward: farmers they added, with activation status and active batches.
 * Add one with POST /api/steward/farmers; resend the code with
 * POST /api/steward/farmers/[id]/resend-activation; assign one to a batch with
 * POST /api/steward/investments/[id]/assign.
 */
export async function GET() {
  const user = await requireMobileUser();
  if (user instanceof Response) return user;
  if (user.role !== "steward") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const db = createAdminClient();
  const { data: farmers } = await db
    .from("users")
    .select("id, full_name, phone, status, created_at")
    .eq("role", "farmer")
    .eq("assigned_steward_id", user.id)
    .order("created_at", { ascending: false });

  const ids = (farmers ?? []).map((f) => f.id);
  const { data: batches } = ids.length
    ? await db.from("investments").select("farmer_id").in("farmer_id", ids).neq("current_stage", "settled")
    : { data: [] };
  const active = new Map<string, number>();
  for (const b of batches ?? []) active.set(b.farmer_id as string, (active.get(b.farmer_id as string) ?? 0) + 1);

  return json({
    farmers: (farmers ?? []).map((f) => ({
      id: f.id,
      fullName: f.full_name,
      phone: f.phone,
      // "pending_activation" until the farmer sets a password with their code.
      status: f.status,
      activeBatches: active.get(f.id) ?? 0,
      createdAt: f.created_at,
    })),
  });
}
