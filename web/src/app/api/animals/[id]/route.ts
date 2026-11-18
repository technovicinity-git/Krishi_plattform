import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { investmentRoleFor } from "@/lib/investments/access";

export const runtime = "nodejs";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((v) => (v ? v : null));

const schema = z.object({
  ear_tag: optionalText(40),
  breed: optionalText(80),
  sex: z.enum(["male", "female", ""]).optional().transform((v) => (v ? v : null)),
  notes: optionalText(1000),
});

/** Farmer edits an animal's details (ear tag, breed, sex, notes). */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: animal } = await db.from("animals").select("id, investment_id").eq("id", id).maybeSingle();
  if (!animal) return NextResponse.json({ error: "Animal not found" }, { status: 404 });

  const access = await investmentRoleFor(user, animal.investment_id);
  if (access?.role !== "farmer") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  // Only change the fields that were sent; leave the rest as they are.
  const changes = Object.fromEntries(
    Object.entries(parsed.data).filter(([key]) => body !== null && key in body),
  );
  if (Object.keys(changes).length === 0) return NextResponse.json({ success: true });

  const { error } = await db.from("animals").update(changes).eq("id", id);
  if (error) {
    console.error("[animals PATCH] failed:", error);
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
