import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionFromCookie } from "@/lib/auth/session";

export const runtime = "nodejs";

const ALLOWED_CATEGORIES = ["cattle", "goats", "sheep", "dumba", "garoleSheep", "other"];

const schema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  stewardType: z.enum(["individual", "organization"]),
  divisionId: z.string().uuid(),
  districtId: z.string().uuid(),
  upazila: z.string().trim().max(120).optional().or(z.literal("")),
  categories: z.array(z.enum(ALLOWED_CATEGORIES as [string, ...string[]])).min(1),
  experience: z.string().trim().min(10).max(3000),
});

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookie();
    if (!session || session.role !== "steward") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    // Verify district belongs to division
    const { data: district } = await admin
      .from("districts")
      .select("id, division_id")
      .eq("id", parsed.data.districtId)
      .maybeSingle();

    if (!district || district.division_id !== parsed.data.divisionId) {
      return NextResponse.json(
        { error: "District does not belong to the selected division" },
        { status: 400 },
      );
    }

    const { error: upsertError } = await admin
      .from("steward_profiles")
      .upsert(
        {
          user_id: session.sub,
          steward_type: parsed.data.stewardType,
          division_id: parsed.data.divisionId,
          district_id: parsed.data.districtId,
          upazila: parsed.data.upazila || null,
          categories: parsed.data.categories,
          experience: parsed.data.experience,
        },
        { onConflict: "user_id" },
      );

    if (upsertError) {
      console.error("[steward-details] upsert failed:", upsertError);
      return NextResponse.json(
        { error: "Failed to save steward details" },
        { status: 500 },
      );
    }

    // Optionally update the name if changed
    if (parsed.data.fullName) {
      await admin
        .from("users")
        .update({ full_name: parsed.data.fullName })
        .eq("id", session.sub);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[steward-details] unexpected:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}