import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/lib/admin/current-admin";

export const runtime = "nodejs";

/** GET ?q= — up to 10 active investors, stewards or farmers by name or phone. */
export async function GET(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only characters that appear in names and phone numbers, so the
  // PostgREST filter below cannot be broken out of.
  const q = (new URL(request.url).searchParams.get("q") ?? "").replace(/[^\p{L}\p{N} +.-]/gu, "").trim().slice(0, 40);
  if (q.length < 2) return NextResponse.json({ items: [] });

  const { data } = await createAdminClient()
    .from("users")
    .select("id, full_name, phone, role")
    .eq("status", "active")
    .neq("role", "admin")
    .or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`)
    .order("full_name")
    .limit(10);

  const ids = (data ?? []).map((u) => u.id);
  const { data: phones } = ids.length
    ? await createAdminClient().from("push_tokens").select("user_id").in("user_id", ids)
    : { data: [] };
  const withApp = new Set((phones ?? []).map((p) => p.user_id));

  return NextResponse.json({
    items: (data ?? []).map((u) => ({ id: u.id, name: u.full_name, phone: u.phone, role: u.role, hasApp: withApp.has(u.id) })),
  });
}
