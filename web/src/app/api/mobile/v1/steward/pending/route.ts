import { NextResponse } from "next/server";
import { requireMobileUser, json, investmentIdsFor } from "@/lib/mobile/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { signFileUrls } from "@/lib/storage/private-files";

export const runtime = "nodejs";

/**
 * Steward: everything waiting for a decision across their batches. Decide with
 * PATCH /api/steward/fund-requests/[id], /api/steward/expenses/[id],
 * /api/steward/sales/[id] and /api/steward/animals/[id]/death.
 */
export async function GET() {
  const user = await requireMobileUser();
  if (user instanceof Response) return user;
  if (user.role !== "steward") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const ids = await investmentIdsFor(user);
  if (ids.length === 0) return json({ fundRequests: [], expenses: [], sales: [], deathReports: [] });
  const db = createAdminClient();

  const [{ data: invs }, { data: funds }, { data: expenses }, { data: sales }, { data: animals }] = await Promise.all([
    db
      .from("investments")
      .select("id, reference, farmer:users!farmer_id ( full_name ), offering:steward_plan_offerings!offering_id ( investment_plans ( name_en, name_bn ) )")
      .in("id", ids),
    db
      .from("fund_requests")
      .select("id, reference, investment_id, amount, purpose, created_at")
      .in("investment_id", ids)
      .eq("status", "pending")
      .order("created_at"),
    db
      .from("expenses")
      .select("id, investment_id, amount, category, description, receipt_path, created_at")
      .in("investment_id", ids)
      .eq("status", "pending")
      .order("created_at"),
    db
      .from("investment_sales")
      .select("id, reference, investment_id, sale_amount, animals_sold, sale_date, buyer_name, buyer_phone, note, photo_path, created_at")
      .in("investment_id", ids)
      .eq("status", "pending_review")
      .order("created_at"),
    db
      .from("animals")
      .select("id, investment_id, tag, ear_tag, death_cause")
      .in("investment_id", ids)
      .eq("status", "death_reported"),
  ]);

  const { data: reports } = animals?.length
    ? await db
        .from("animal_records")
        .select("animal_id, note, photo_path, document_path, recorded_on, created_at")
        .in("animal_id", animals.map((a) => a.id))
        .eq("kind", "death")
        .eq("review_status", "pending")
    : { data: [] };

  const urls = await signFileUrls([
    ...(expenses ?? []).map((e) => e.receipt_path),
    ...(sales ?? []).map((s) => s.photo_path),
    ...(reports ?? []).flatMap((r) => [r.photo_path, r.document_path]),
  ]);
  const url = (p: string | null) => (p ? urls.get(p) ?? null : null);

  type Inv = { id: string; reference: string; farmer: { full_name: string | null } | null; offering: { investment_plans: { name_en: string | null; name_bn: string | null } | null } | null };
  const batch = new Map(
    ((invs ?? []) as unknown as Inv[]).map((i) => [
      i.id,
      {
        investmentId: i.id,
        batchReference: i.reference,
        planEn: i.offering?.investment_plans?.name_en ?? "",
        planBn: i.offering?.investment_plans?.name_bn ?? i.offering?.investment_plans?.name_en ?? "",
        farmerName: i.farmer?.full_name ?? null,
      },
    ]),
  );
  const report = new Map((reports ?? []).map((r) => [r.animal_id, r]));

  return json({
    fundRequests: (funds ?? []).map((f) => ({
      ...batch.get(f.investment_id),
      id: f.id,
      reference: f.reference,
      amount: Number(f.amount),
      purpose: f.purpose,
      createdAt: f.created_at,
    })),
    expenses: (expenses ?? []).map((e) => ({
      ...batch.get(e.investment_id),
      id: e.id,
      amount: Number(e.amount),
      category: e.category,
      description: e.description,
      receiptUrl: url(e.receipt_path),
      createdAt: e.created_at,
    })),
    sales: (sales ?? []).map((s) => ({
      ...batch.get(s.investment_id),
      id: s.id,
      reference: s.reference,
      saleAmount: Number(s.sale_amount),
      animalsSold: s.animals_sold,
      saleDate: s.sale_date,
      buyerName: s.buyer_name,
      buyerPhone: s.buyer_phone,
      note: s.note,
      photoUrl: url(s.photo_path),
      createdAt: s.created_at,
    })),
    deathReports: (animals ?? []).map((a) => {
      const r = report.get(a.id);
      return {
        ...batch.get(a.investment_id),
        animalId: a.id,
        tag: a.tag,
        earTag: a.ear_tag,
        cause: a.death_cause,
        note: r?.note ?? null,
        photoUrl: url(r?.photo_path ?? null),
        documentUrl: url(r?.document_path ?? null),
        recordedOn: r?.recorded_on ?? null,
        createdAt: r?.created_at ?? null,
      };
    }),
  });
}
