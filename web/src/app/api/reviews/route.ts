import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { notify, investmentParties } from "@/lib/notifications/notify";

export const runtime = "nodejs";

const schema = z.object({
  investment_id: z.string().uuid(),
  rating: z.coerce.number().int().min(1, "Choose 1 to 5 stars").max(5, "Choose 1 to 5 stars"),
  comment: z.string().trim().max(1000).optional().default(""),
});

/**
 * Investor rates the steward of a settled investment (1–5 stars + comment).
 * One review per investment; sending again updates it. A review an admin
 * has hidden stays hidden when edited.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "investor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { investment_id, rating, comment } = parsed.data;

  const db = createAdminClient();
  const { data: inv } = await db
    .from("investments")
    .select("id, investor_id, status, current_stage, offering:steward_plan_offerings!offering_id ( steward_id )")
    .eq("id", investment_id)
    .maybeSingle();
  if (!inv || inv.investor_id !== user.id) {
    return NextResponse.json({ error: "Investment not found" }, { status: 404 });
  }
  if (inv.current_stage !== "settled") {
    return NextResponse.json({ error: "You can review once the investment is settled" }, { status: 400 });
  }
  const stewardId = (inv.offering as unknown as { steward_id: string } | null)?.steward_id;
  if (!stewardId) return NextResponse.json({ error: "No steward on this investment" }, { status: 400 });

  const { data: existing } = await db
    .from("steward_reviews")
    .select("id")
    .eq("investment_id", inv.id)
    .maybeSingle();

  const row = { rating, comment: comment || null };
  const { error } = existing
    ? await db.from("steward_reviews").update(row).eq("id", existing.id)
    : await db.from("steward_reviews").insert({ ...row, investment_id: inv.id, investor_id: user.id, steward_id: stewardId });
  if (error) {
    console.error("[reviews] save failed:", error);
    return NextResponse.json({ error: "Could not save your review" }, { status: 500 });
  }

  if (!existing) {
    const parties = await investmentParties(inv.id);
    await notify(
      "review_received",
      { userId: stewardId, href: "/steward/profile" },
      { name: String(rating), plan: parties?.plan, planBn: parties?.planBn, reference: parties?.reference },
    );
  }

  return NextResponse.json({ success: true });
}
