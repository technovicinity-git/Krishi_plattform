import { createAdminClient } from "@/lib/supabase/admin";
import { signFileUrls } from "@/lib/storage/private-files";

export const ANIMAL_RECORD_KINDS = ["weight", "health", "vaccination", "treatment", "note", "death"] as const;
export type AnimalRecordKind = (typeof ANIMAL_RECORD_KINDS)[number];

export interface AnimalRecord {
  id: string;
  kind: string;
  weightKg: number | null;
  note: string | null;
  photoUrl: string | null;
  recordedOn: string;
  authorRole: string | null;
  createdAt: string;
}

export interface Animal {
  id: string;
  reference: string;
  investmentId: string;
  tag: string;
  earTag: string | null;
  breed: string | null;
  sex: string | null;
  purchasePrice: number | null;
  purchaseWeightKg: number | null;
  currentWeightKg: number | null;
  purchasedAt: string | null;
  status: string;
  salePrice: number | null;
  soldAt: string | null;
  diedAt: string | null;
  notes: string | null;
  records: AnimalRecord[];
}

/** Animal with the batch it belongs to, for cross-batch livestock lists. */
export interface AnimalWithBatch extends Animal {
  batch: { reference: string; planEn: string; planBn: string; farmerName: string | null };
}

const ANIMAL_COLUMNS =
  "id, reference, investment_id, tag, ear_tag, breed, sex, purchase_price, purchase_weight_kg, current_weight_kg, purchased_at, status, sale_price, sold_at, died_at, notes";

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAnimal(a: any, records: AnimalRecord[]): Animal {
  return {
    id: a.id,
    reference: a.reference,
    investmentId: a.investment_id,
    tag: a.tag,
    earTag: a.ear_tag,
    breed: a.breed,
    sex: a.sex,
    purchasePrice: num(a.purchase_price),
    purchaseWeightKg: num(a.purchase_weight_kg),
    currentWeightKg: num(a.current_weight_kg),
    purchasedAt: a.purchased_at,
    status: a.status,
    salePrice: num(a.sale_price),
    soldAt: a.sold_at,
    diedAt: a.died_at,
    notes: a.notes,
    records,
  };
}

/** Records for a set of animals, newest first, with signed photo links. */
async function loadRecords(animalIds: string[]): Promise<Map<string, AnimalRecord[]>> {
  const byAnimal = new Map<string, AnimalRecord[]>();
  if (animalIds.length === 0) return byAnimal;
  const { data } = await createAdminClient()
    .from("animal_records")
    .select("id, animal_id, kind, weight_kg, note, photo_path, recorded_on, author_role, created_at")
    .in("animal_id", animalIds)
    .order("recorded_on", { ascending: false })
    .order("created_at", { ascending: false });
  const urls = await signFileUrls((data ?? []).map((r) => r.photo_path));
  for (const r of data ?? []) {
    const list = byAnimal.get(r.animal_id) ?? [];
    list.push({
      id: r.id,
      kind: r.kind,
      weightKg: num(r.weight_kg),
      note: r.note,
      photoUrl: r.photo_path ? urls.get(r.photo_path) ?? null : null,
      recordedOn: r.recorded_on,
      authorRole: r.author_role,
      createdAt: r.created_at,
    });
    byAnimal.set(r.animal_id, list);
  }
  return byAnimal;
}

/** All animals of one batch, with their records. Server-only. */
export async function getAnimalsForInvestment(investmentId: string): Promise<Animal[]> {
  const { data } = await createAdminClient()
    .from("animals")
    .select(ANIMAL_COLUMNS)
    .eq("investment_id", investmentId)
    .order("tag");
  const rows = data ?? [];
  const records = await loadRecords(rows.map((a) => a.id));
  return rows.map((a) => mapAnimal(a, records.get(a.id) ?? []));
}

/** Every animal across a set of batches (livestock pages). Server-only. */
export async function getAnimalsForInvestments(investmentIds: string[]): Promise<AnimalWithBatch[]> {
  if (investmentIds.length === 0) return [];
  const { data } = await createAdminClient()
    .from("animals")
    .select(`
      ${ANIMAL_COLUMNS},
      investment:investments!investment_id (
        reference,
        farmer:users!farmer_id ( full_name ),
        offering:steward_plan_offerings!offering_id ( investment_plans ( name_en, name_bn ) )
      )
    `)
    .in("investment_id", investmentIds)
    .order("created_at", { ascending: false })
    .order("tag");
  const rows = data ?? [];
  const records = await loadRecords(rows.map((a) => a.id));
  return rows.map((a) => {
    const inv = a.investment as unknown as {
      reference: string;
      farmer: { full_name: string | null } | null;
      offering: { investment_plans: { name_en: string | null; name_bn: string | null } | null } | null;
    } | null;
    const plan = inv?.offering?.investment_plans;
    return {
      ...mapAnimal(a, records.get(a.id) ?? []),
      batch: {
        reference: inv?.reference ?? "",
        planEn: plan?.name_en ?? "",
        planBn: plan?.name_bn ?? plan?.name_en ?? "",
        farmerName: inv?.farmer?.full_name ?? null,
      },
    };
  });
}

/**
 * Creates one animal per animal bought. Tags continue after any existing
 * ones (A01, A02…). Server-only.
 */
export async function createAnimalsForPurchase(opts: {
  investmentId: string;
  count: number;
  totalCost: number;
  avgWeightKg?: number | null;
  breed?: string | null;
  purchasedAt: string;
}): Promise<void> {
  const db = createAdminClient();
  const { count: existing } = await db
    .from("animals")
    .select("id", { count: "exact", head: true })
    .eq("investment_id", opts.investmentId);
  const start = (existing ?? 0) + 1;
  const each = Math.round((opts.totalCost / opts.count) * 100) / 100;
  const rows = Array.from({ length: opts.count }, (_, i) => ({
    investment_id: opts.investmentId,
    tag: `A${String(start + i).padStart(2, "0")}`,
    breed: opts.breed || null,
    purchase_price: each,
    purchase_weight_kg: opts.avgWeightKg || null,
    current_weight_kg: opts.avgWeightKg || null,
    purchased_at: opts.purchasedAt,
  }));
  const { error } = await db.from("animals").insert(rows);
  if (error) console.error("[createAnimalsForPurchase] failed:", error);
}
