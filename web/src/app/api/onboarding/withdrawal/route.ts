import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionFromCookie } from "@/lib/auth/session";
import { isValidBDPhone } from "@/lib/auth/phone";

export const runtime = "nodejs";

const mobileSchema = z.object({
  method: z.literal("mobile"),
  mfsProvider: z.enum(["bkash", "nagad", "rocket"]),
  mobileNumber: z.string().trim().refine(isValidBDPhone, "Invalid mobile number"),
  accountHolderName: z.string().trim().min(2).max(120),
});

const bankSchema = z.object({
  method: z.literal("bank"),
  bankName: z.string().trim().min(2).max(120),
  bankAccountNumber: z.string().trim().min(6).max(34),
  bankBranch: z.string().trim().min(2).max(120),
  bankRoutingNumber: z.string().trim().min(6).max(20),
  accountHolderName: z.string().trim().min(2).max(120),
});

const schema = z.discriminatedUnion("method", [mobileSchema, bankSchema]);

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json(
        { error: "Session expired. Please log in again." },
        { status: 401 },
      );
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
    const data = parsed.data;

    const row = {
      user_id: session.sub,
      method: data.method,
      account_holder_name: data.accountHolderName,
      mfs_provider: data.method === "mobile" ? data.mfsProvider : null,
      mobile_number: data.method === "mobile" ? data.mobileNumber : null,
      bank_name: data.method === "bank" ? data.bankName : null,
      bank_account_number: data.method === "bank" ? data.bankAccountNumber : null,
      bank_branch: data.method === "bank" ? data.bankBranch : null,
      bank_routing_number: data.method === "bank" ? data.bankRoutingNumber : null,
    };

    // Re-saving the same details is not a change: keep "last changed" as it was.
    const { data: existing } = await admin
      .from("withdrawal_preferences")
      .select("method, account_holder_name, mfs_provider, mobile_number, bank_name, bank_account_number, bank_branch, bank_routing_number")
      .eq("user_id", session.sub)
      .maybeSingle();
    const unchanged =
      existing !== null &&
      (Object.keys(existing) as (keyof typeof existing)[]).every((k) => (existing[k] ?? null) === (row[k] ?? null));
    if (unchanged) return NextResponse.json({ success: true });

    const { error } = await admin
      .from("withdrawal_preferences")
      .upsert(row, { onConflict: "user_id" });

    if (error) {
      console.error("[onboarding/withdrawal] upsert failed:", error);
      return NextResponse.json(
        { error: "Failed to save withdrawal preference" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[onboarding/withdrawal] unexpected:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}