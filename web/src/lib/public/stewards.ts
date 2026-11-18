import { createAdminClient } from "@/lib/supabase/admin";
import { getStewardRatings } from "@/lib/reviews";

export interface StewardListItem {
  id: string;
  name: string;
  type: string | null;
  divisionName: string | null;
  districtName: string | null;
  operatingArea: string | null;
  categories: string[];
  offeringsCount: number;
  ratingAvg: number | null;
  ratingCount: number;
}

export async function listPublicStewards(opts: {
  divisionSlug?: string;
  categorySlug?: string;
  page?: number;
  limit?: number;
} = {}) {
  const db = createAdminClient();
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(50, Math.max(1, opts.limit ?? 12));
  const offset = (page - 1) * limit;

  const query = db
    .from("users")
    .select(
      `
      id, full_name,
      steward_profiles ( steward_type, experience, division_id, district_id, upazila, categories,
        divisions ( slug, name_en ),
        districts ( slug, name_en, name_bn )
      ),
      steward_plan_offerings!steward_id ( id, status )
      `,
      { count: "exact" },
    )
    .eq("role", "steward")
    .eq("steward_approval_status", "approved")
    .eq("status", "active")
    .range(offset, offset + limit - 1)
    .order("created_at", { ascending: true });

  const { data, error, count } = await query;
  if (error) {
    console.error("[listPublicStewards] error:", error);
    return { items: [], total: 0, page, limit, hasMore: false };
  }

  const items: StewardListItem[] = (data ?? []).map((row: any) => {
    const rawProfile = row.steward_profiles;
    const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
    const offerings = (row.steward_plan_offerings ?? []).filter(
      (o: any) => o.status === "approved",
    );
    return {
      id: row.id,
      name: row.full_name ?? "Steward",
      type: profile?.steward_type ?? null,
      divisionName: profile?.divisions?.name_en ?? null,
      districtName: profile?.districts?.name_en ?? null,
      operatingArea: profile
        ? [profile.upazila, profile.districts?.name_en].filter(Boolean).join(", ")
        : null,
      categories: profile?.categories ?? [],
      offeringsCount: offerings.length,
      ratingAvg: null,
      ratingCount: 0,
    };
  });

  // Real ratings from published investor reviews.
  const ratings = await getStewardRatings(items.map((i) => i.id));
  for (const item of items) {
    const r = ratings.get(item.id);
    item.ratingAvg = r?.avg ?? null;
    item.ratingCount = r?.count ?? 0;
  }

  return {
    items,
    total: count ?? 0,
    page,
    limit,
    hasMore: (count ?? 0) > offset + items.length,
  };
}

export async function findPublicStewardBySlug(idOrSlug: string) {
  const db = createAdminClient();
  const { data, error } = await db
    .from("users")
    .select(
      `
      id, full_name,
      steward_profiles ( steward_type, experience, division_id, district_id, upazila, categories,
        divisions ( slug, name_en ),
        districts ( slug, name_en, name_bn )
      ),
      steward_plan_offerings!steward_id (
        id, status, units_offered, units_funded,
        investment_plans (
          id, slug, name_en, name_bn, image_path,
          duration_months, unit_price, animal_allocation, care_allocation,
          estimated_roi_min, estimated_roi_max, status,
          livestock_categories ( slug, name_en ),
          divisions ( slug, name_en ),
          districts ( slug, name_en, name_bn )
        )
      )
      `,
    )
    .eq("id", idOrSlug)
    .eq("role", "steward")
    .eq("steward_approval_status", "approved")
    .maybeSingle();

  if (error || !data) return null;
  return data;
}