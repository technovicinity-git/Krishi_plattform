import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { uploadUpdatePhoto } from "@/lib/investments/photos";

export const runtime = "nodejs";

const schema = z.object({
  investment_id: z.string().uuid(),
  update_type: z.enum(["health_check", "photo_update", "note"]),
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().max(2000).optional().default(""),
});

/**
 * Farmer posts a health check, photo or note to an investment timeline.
 * Body: multipart form (investment_id, update_type, title, body, photo?).
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "farmer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const parsed = schema.safeParse({
    investment_id: form.get("investment_id"),
    update_type: form.get("update_type"),
    title: form.get("title"),
    body: form.get("body") ?? undefined,
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
    .select("id")
    .eq("id", parsed.data.investment_id)
    .eq("farmer_id", user.id)
    .maybeSingle();
  if (!inv) return NextResponse.json({ error: "Investment not found" }, { status: 404 });

  const photo = await uploadUpdatePhoto(form.get("photo"), inv.id);
  if (!photo.ok) return NextResponse.json({ error: photo.error }, { status: 400 });
  if (parsed.data.update_type === "photo_update" && !photo.path) {
    return NextResponse.json({ error: "A photo is required for a photo update" }, { status: 400 });
  }

  const { error } = await db.from("investment_updates").insert({
    investment_id: inv.id,
    author_id: user.id,
    author_role: "farmer",
    update_type: parsed.data.update_type,
    title: parsed.data.title,
    body: parsed.data.body || null,
    photo_path: photo.path,
  });

  if (error) {
    console.error("[farmer/updates] insert failed:", error);
    return NextResponse.json({ error: "Failed to post update" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
