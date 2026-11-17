import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";

export const runtime = "nodejs";

const schema = z.object({
  farmer_id: z.string().uuid(),
});

export async function POST(
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
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Verify the investment belongs to an offering owned by this steward
  const { data: investment } = await db
    .from("investments")
    .select(`
      id, current_stage,
      offering:steward_plan_offerings!offering_id ( steward_id )
    `)
    .eq("id", id)
    .maybeSingle();

  if (!investment || (investment.offering as any).steward_id !== user.id) {
    return NextResponse.json({ error: "Investment not found or unauthorized" }, { status: 404 });
  }

  if (investment.current_stage !== "awaiting_farmer") {
    return NextResponse.json({ error: "Investment already assigned or in progress" }, { status: 400 });
  }

  // Verify the farmer belongs to this steward
  const { data: farmer } = await db
    .from("users")
    .select("id")
    .eq("id", parsed.data.farmer_id)
    .eq("role", "farmer")
    .eq("assigned_steward_id", user.id)
    .maybeSingle();

  if (!farmer) {
    return NextResponse.json({ error: "Invalid farmer" }, { status: 400 });
  }

  // Update investment
  const { error } = await db
    .from("investments")
    .update({
      farmer_id: parsed.data.farmer_id,
      current_stage: "awaiting_purchase",
    })
    .eq("id", id);

  if (error) {
    console.error("[assign farmer] error:", error);
    return NextResponse.json({ error: "Failed to assign farmer" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}