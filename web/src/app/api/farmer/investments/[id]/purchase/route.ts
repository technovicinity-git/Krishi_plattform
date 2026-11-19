import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { uploadUpdatePhoto } from "@/lib/investments/photos";
import { createAnimalsForPurchase } from "@/lib/animals";
import { notify, investmentParties } from "@/lib/notifications/notify";
import { timeline } from "@/lib/investments/timeline";

export const runtime = "nodejs";

const schema = z.object({
  animals: z.coerce.number().int().min(1).max(500),
  total_cost: z.coerce.number().positive().max(100_000_000),
  note: z.string().trim().max(1000).optional().default(""),
  breed: z.string().trim().max(80).optional().default(""),
  avg_weight: z
    .union([z.literal(""), z.coerce.number().positive().max(2000)])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
});

/**
 * Farmer confirms the animals were bought. Moves the investment from
 * `awaiting_purchase` to `growing_care` and posts a purchase update.
 * Body: multipart form (animals, total_cost, note, breed?, avg_weight?, photo?).
 * Creates one `animals` row per animal bought.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "farmer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const parsed = schema.safeParse({
    animals: form.get("animals"),
    total_cost: form.get("total_cost"),
    note: form.get("note") ?? undefined,
    breed: form.get("breed") ?? undefined,
    avg_weight: form.get("avg_weight") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const db = createAdminClient();
  const { data: inv } = await db
    .from("investments")
    .select("id, current_stage")
    .eq("id", id)
    .eq("farmer_id", user.id)
    .maybeSingle();

  if (!inv) return NextResponse.json({ error: "Investment not found" }, { status: 404 });
  if (inv.current_stage !== "awaiting_purchase") {
    return NextResponse.json(
      { error: "This batch is not waiting for a purchase" },
      { status: 400 },
    );
  }

  const photo = await uploadUpdatePhoto(form.get("photo"), inv.id);
  if (!photo.ok) return NextResponse.json({ error: photo.error }, { status: 400 });

  // Conditional update so a double submit can't advance the stage twice.
  const { data: moved, error: stageError } = await db
    .from("investments")
    .update({ current_stage: "growing_care" })
    .eq("id", inv.id)
    .eq("current_stage", "awaiting_purchase")
    .select("id");

  if (stageError) {
    console.error("[farmer/purchase] stage update failed:", stageError);
    return NextResponse.json({ error: "Failed to confirm purchase" }, { status: 500 });
  }
  if (!moved?.length) {
    return NextResponse.json({ error: "Purchase already confirmed" }, { status: 409 });
  }

  const { animals, total_cost, note, breed, avg_weight } = parsed.data;

  // One record per animal bought, so each can be weighed and tracked.
  await createAnimalsForPurchase({
    investmentId: inv.id,
    count: animals,
    totalCost: total_cost,
    avgWeightKg: avg_weight,
    breed,
    purchasedAt: new Date().toISOString().slice(0, 10),
  });
  await db.from("investment_updates").insert({
    investment_id: inv.id,
    author_id: user.id,
    author_role: "farmer",
    update_type: "purchase",
    title: `Purchased ${animals} ${animals === 1 ? "animal" : "animals"}`,
    body:
      note ||
      `Bought ${animals} ${animals === 1 ? "animal" : "animals"} for ৳${total_cost.toLocaleString("en-IN")}.`,
    amount: total_cost,
    photo_path: photo.path,
    metadata: {
      animals,
      from_stage: "awaiting_purchase",
      to_stage: "growing_care",
      i18n: timeline("purchase", { count: animals, amount: total_cost }, note),
    },
  });

  const parties = await investmentParties(inv.id);
  if (parties) {
    const params = { reference: parties.reference, plan: parties.plan, planBn: parties.planBn, amount: total_cost };
    await notify("purchase_confirmed", [
      { userId: parties.investorId, href: `/portal/investments/${inv.id}` },
      { userId: parties.stewardId, href: `/steward/investments/${inv.id}` },
    ], params);
  }

  return NextResponse.json({ success: true });
}
