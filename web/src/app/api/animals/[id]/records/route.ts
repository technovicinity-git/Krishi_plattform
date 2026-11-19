import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { investmentRoleFor } from "@/lib/investments/access";
import { uploadUpdatePhoto } from "@/lib/investments/photos";
import { ANIMAL_RECORD_KINDS } from "@/lib/animals";
import { notify, investmentParties } from "@/lib/notifications/notify";
import { timeline } from "@/lib/investments/timeline";

export const runtime = "nodejs";

const schema = z
  .object({
    kind: z.enum(ANIMAL_RECORD_KINDS),
    weight_kg: z
      .union([z.literal(""), z.coerce.number().positive().max(2000)])
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : v)),
    note: z.string().trim().max(1000).optional().default(""),
    recorded_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  })
  .refine((d) => d.kind !== "weight" || d.weight_kg !== null, {
    message: "Enter the weight in kg",
  })
  .refine((d) => d.kind === "weight" || d.note.length > 0, {
    message: "Add a short note",
  });

/**
 * Farmer or steward adds a weight / health / vaccination / treatment / note
 * record to an animal. "death" marks the animal dead. Body: multipart form
 * (kind, weight_kg?, note, recorded_on, photo?).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }
  const parsed = schema.safeParse({
    kind: form.get("kind"),
    weight_kg: form.get("weight_kg") ?? undefined,
    note: form.get("note") ?? undefined,
    recorded_on: form.get("recorded_on"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const data = parsed.data;
  if (new Date(`${data.recorded_on}T00:00:00Z`).getTime() > Date.now() + 24 * 60 * 60 * 1000) {
    return NextResponse.json({ error: "The date cannot be in the future" }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: animal } = await db
    .from("animals")
    .select("id, investment_id, status, tag")
    .eq("id", id)
    .maybeSingle();
  if (!animal) return NextResponse.json({ error: "Animal not found" }, { status: 404 });

  const access = await investmentRoleFor(user, animal.investment_id);
  if (access?.role !== "farmer" && access?.role !== "steward") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  if (animal.status !== "active") {
    return NextResponse.json({ error: "This animal is no longer active" }, { status: 400 });
  }

  const photo = await uploadUpdatePhoto(form.get("photo"), animal.investment_id, "updates");
  if (!photo.ok) return NextResponse.json({ error: photo.error }, { status: 400 });

  const { error } = await db.from("animal_records").insert({
    animal_id: animal.id,
    author_id: user.id,
    author_role: access.role,
    kind: data.kind,
    weight_kg: data.weight_kg,
    note: data.note || null,
    photo_path: photo.path,
    recorded_on: data.recorded_on,
  });
  if (error) {
    console.error("[animal records] insert failed:", error);
    return NextResponse.json({ error: "Could not save the record" }, { status: 500 });
  }

  // Keep the animal's headline numbers in step with its latest record.
  if (data.kind === "weight" && data.weight_kg !== null) {
    const { data: latest } = await db
      .from("animal_records")
      .select("weight_kg")
      .eq("animal_id", animal.id)
      .eq("kind", "weight")
      .order("recorded_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    await db.from("animals").update({ current_weight_kg: latest?.weight_kg ?? data.weight_kg }).eq("id", animal.id);
  }
  if (data.kind === "death") {
    await db.from("animals").update({ status: "dead", died_at: data.recorded_on }).eq("id", animal.id);
    await db.from("investment_updates").insert({
      investment_id: animal.investment_id,
      author_id: user.id,
      author_role: access.role,
      update_type: "health_check",
      title: `Animal ${animal.tag} died`,
      body: data.note,
      photo_path: photo.path,
      metadata: { i18n: timeline("animal_died", { tag: animal.tag }, data.note) },
    });
    const parties = await investmentParties(animal.investment_id);
    if (parties) {
      const params = { reference: parties.reference, plan: parties.plan, planBn: parties.planBn, name: animal.tag, reason: data.note };
      await notify("animal_died", [
        { userId: parties.investorId, href: `/portal/investments/${animal.investment_id}` },
        access.role === "farmer"
          ? { userId: parties.stewardId, href: `/steward/investments/${animal.investment_id}` }
          : { userId: parties.farmerId, href: `/farmer/investments/${animal.investment_id}` },
      ], params);
    }
  }

  return NextResponse.json({ success: true });
}
