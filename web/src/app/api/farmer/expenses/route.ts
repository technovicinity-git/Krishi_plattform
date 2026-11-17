import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";

export const runtime = "nodejs";

const schema = z.object({
  investment_id: z.string().uuid(),
  amount: z.coerce.number().positive(),
  category: z.string(),
  description: z.string().optional(),
  receipt_path: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "farmer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const db = createAdminClient();

  const { data: inv } = await db
    .from("investments")
    .select("id")
    .eq("id", parsed.data.investment_id)
    .eq("farmer_id", user.id)
    .maybeSingle();

  if (!inv) return NextResponse.json({ error: "Investment not found" }, { status: 404 });

  const { error } = await db.from("expenses").insert({
    investment_id: inv.id,
    farmer_id: user.id,
    amount: parsed.data.amount,
    category: parsed.data.category,
    description: parsed.data.description,
    receipt_path: parsed.data.receipt_path || null,
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
    title: `Expense Logged: ${parsed.data.category.replace(/_/g, " ")}`,
    body: parsed.data.description || `Spent ৳${parsed.data.amount.toLocaleString("en-IN")} on ${parsed.data.category}.`,
    amount: parsed.data.amount,
    photo_path: parsed.data.receipt_path,
  });

  return NextResponse.json({ success: true });
}