import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { uploadUpdatePhoto } from "@/lib/investments/photos";
import { notify, investmentParties } from "@/lib/notifications/notify";

export const runtime = "nodejs";

const schema = z.object({
  investment_id: z.string().uuid(),
  amount: z.coerce.number().positive().max(100_000_000),
  category: z.enum(["animal_purchase", "feed", "medical", "transport", "other"]),
  description: z.string().trim().max(500).optional().default(""),
});

/**
 * Farmer logs money spent on a batch. Body: multipart form
 * (investment_id, amount, category, description, receipt?). The receipt
 * image is uploaded server-side.
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
    amount: form.get("amount"),
    category: form.get("category"),
    description: form.get("description") ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const db = createAdminClient();

  const { data: inv } = await db
    .from("investments")
    .select("id, current_stage")
    .eq("id", parsed.data.investment_id)
    .eq("farmer_id", user.id)
    .maybeSingle();

  if (!inv) return NextResponse.json({ error: "Investment not found" }, { status: 404 });
  if (!["awaiting_purchase", "growing_care"].includes(inv.current_stage ?? "")) {
    return NextResponse.json(
      { error: "Expenses can only be logged while the batch is being bought or raised" },
      { status: 400 },
    );
  }

  const receipt = await uploadUpdatePhoto(form.get("receipt"), inv.id, "receipts");
  if (!receipt.ok) return NextResponse.json({ error: receipt.error }, { status: 400 });

  const { amount, category, description } = parsed.data;
  const { error } = await db.from("expenses").insert({
    investment_id: inv.id,
    farmer_id: user.id,
    amount,
    category,
    description: description || null,
    receipt_path: receipt.path,
    status: "pending",
  });

  if (error) {
    console.error("[farmer/expenses] error:", error);
    return NextResponse.json({ error: "Failed to submit expense" }, { status: 500 });
  }

  await db.from("investment_updates").insert({
    investment_id: inv.id,
    author_id: user.id,
    author_role: "farmer",
    update_type: "expense",
    title: `Expense Logged: ${category.replace(/_/g, " ")}`,
    body: description || `Spent ৳${amount.toLocaleString("en-IN")} on ${category.replace(/_/g, " ")}.`,
    amount,
    photo_path: receipt.path,
  });

  const parties = await investmentParties(inv.id);
  if (parties) {
    await notify(
      "expense_logged",
      { userId: parties.stewardId, href: "/steward/expenses" },
      { amount, name: user.fullName ?? undefined, plan: parties.plan, planBn: parties.planBn, reference: parties.reference },
    );
  }

  return NextResponse.json({ success: true });
}
