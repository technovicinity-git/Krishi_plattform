import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { uploadUpdatePhoto } from "@/lib/investments/photos";
import { notify, investmentParties } from "@/lib/notifications/notify";

export const runtime = "nodejs";

const schema = z.object({
  animals_sold: z.coerce.number().int().min(1).max(500),
  sale_amount: z.coerce.number().positive().max(100_000_000),
  sale_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid sale date"),
  buyer_name: z.string().trim().max(120).optional().default(""),
  buyer_phone: z.string().trim().max(20).optional().default(""),
  note: z.string().trim().max(1000).optional().default(""),
});

/**
 * Farmer records the sale of the animals. Moves the batch from
 * `growing_care` to `sale_pending` for the steward to confirm.
 * After a steward rejection the farmer can record it again (same row).
 * Body: multipart form (animals_sold, sale_amount, sale_date, buyer_name?,
 * buyer_phone?, note?, photo?).
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

  // Which tracked animals were sold (when the batch has animal records).
  const animalIds = form.getAll("animal_ids").filter((v): v is string => typeof v === "string" && v.length > 0);

  const parsed = schema.safeParse({
    animals_sold: animalIds.length > 0 ? animalIds.length : form.get("animals_sold"),
    sale_amount: form.get("sale_amount"),
    sale_date: form.get("sale_date"),
    buyer_name: form.get("buyer_name") ?? undefined,
    buyer_phone: form.get("buyer_phone") ?? undefined,
    note: form.get("note") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const data = parsed.data;
  if (new Date(`${data.sale_date}T00:00:00Z`).getTime() > Date.now() + 24 * 60 * 60 * 1000) {
    return NextResponse.json({ error: "Sale date cannot be in the future" }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: inv } = await db
    .from("investments")
    .select("id, current_stage")
    .eq("id", id)
    .eq("farmer_id", user.id)
    .maybeSingle();

  if (!inv) return NextResponse.json({ error: "Investment not found" }, { status: 404 });
  if (inv.current_stage !== "growing_care") {
    return NextResponse.json(
      { error: "A sale can only be recorded while the animals are being raised" },
      { status: 400 },
    );
  }

  const { count: pendingRequests } = await db
    .from("fund_requests")
    .select("id", { count: "exact", head: true })
    .eq("investment_id", inv.id)
    .eq("status", "pending");
  if (pendingRequests) {
    return NextResponse.json(
      { error: "Wait for your steward to answer your pending fund requests first" },
      { status: 400 },
    );
  }

  // Batches with tracked animals must say which ones were sold.
  const { data: activeAnimals } = await db
    .from("animals")
    .select("id")
    .eq("investment_id", inv.id)
    .eq("status", "active");
  const activeIds = new Set((activeAnimals ?? []).map((a) => a.id));
  if (activeIds.size > 0) {
    if (animalIds.length === 0) {
      return NextResponse.json({ error: "Choose the animals you sold" }, { status: 400 });
    }
    if (animalIds.some((aid) => !activeIds.has(aid)) || new Set(animalIds).size !== animalIds.length) {
      return NextResponse.json({ error: "One of the chosen animals is not an active animal in this batch" }, { status: 400 });
    }
  }

  const { data: existing } = await db
    .from("investment_sales")
    .select("id, status")
    .eq("investment_id", inv.id)
    .maybeSingle();
  if (existing && existing.status !== "rejected") {
    return NextResponse.json({ error: "A sale is already recorded for this batch" }, { status: 409 });
  }

  const photo = await uploadUpdatePhoto(form.get("photo"), inv.id, "sales");
  if (!photo.ok) return NextResponse.json({ error: photo.error }, { status: 400 });

  // Claim the stage first so a double submit can't record two sales.
  const { data: moved, error: stageError } = await db
    .from("investments")
    .update({ current_stage: "sale_pending" })
    .eq("id", inv.id)
    .eq("current_stage", "growing_care")
    .select("id");
  if (stageError) {
    console.error("[farmer/sale] stage update failed:", stageError);
    return NextResponse.json({ error: "Failed to record sale" }, { status: 500 });
  }
  if (!moved?.length) {
    return NextResponse.json({ error: "Sale already recorded" }, { status: 409 });
  }

  const row = {
    investment_id: inv.id,
    farmer_id: user.id,
    animals_sold: data.animals_sold,
    animal_ids: animalIds.length > 0 ? animalIds : null,
    sale_amount: data.sale_amount,
    sale_date: data.sale_date,
    buyer_name: data.buyer_name || null,
    buyer_phone: data.buyer_phone || null,
    note: data.note || null,
    photo_path: photo.path,
    status: "pending_review",
    rejection_reason: null,
    reviewed_by: null,
    reviewed_at: null,
  };
  const { data: sale, error } = existing
    ? await db.from("investment_sales").update(row).eq("id", existing.id).select("reference").single()
    : await db.from("investment_sales").insert(row).select("reference").single();

  if (error || !sale) {
    console.error("[farmer/sale] save failed:", error);
    // Give the stage back so the farmer can try again.
    await db
      .from("investments")
      .update({ current_stage: "growing_care" })
      .eq("id", inv.id)
      .eq("current_stage", "sale_pending");
    return NextResponse.json({ error: "Failed to record sale" }, { status: 500 });
  }

  const animals = `${data.animals_sold} ${data.animals_sold === 1 ? "animal" : "animals"}`;
  await db.from("investment_updates").insert({
    investment_id: inv.id,
    author_id: user.id,
    author_role: "farmer",
    update_type: "sale",
    title: `Sold ${animals}`,
    body:
      data.note ||
      `Sold ${animals} for ৳${data.sale_amount.toLocaleString("en-IN")}. Waiting for steward confirmation.`,
    amount: data.sale_amount,
    photo_path: photo.path,
    metadata: { reference: sale.reference, from_stage: "growing_care", to_stage: "sale_pending" },
  });

  const parties = await investmentParties(inv.id);
  if (parties) {
    await notify(
      "sale_recorded",
      { userId: parties.stewardId, href: `/steward/investments/${inv.id}` },
      { reference: sale.reference, amount: data.sale_amount, name: user.fullName ?? undefined, plan: parties.plan, planBn: parties.planBn },
    );
  }

  return NextResponse.json({ success: true, reference: sale.reference });
}
