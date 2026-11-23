import { createAdminClient } from "@/lib/supabase/admin";

export interface OfferingListItem {
  offeringId: string;
  offeringSlug: string;
  planNameEn: string;
  planNameBn: string;
  categorySlug: string;
  categoryNameEn: string;
  categoryNameBn: string;
  divisionNameEn: string;
  divisionNameBn: string;
  districtNameEn: string;
  districtNameBn: string;
  thanaNameEn: string | null;
  thanaNameBn: string | null;
  durationMonths: number;
  roiMin: number;
  roiMax: number;
  unitPrice: number;
  animalAllocation: number;
  careAllocation: number;
  unitsOffered: number;
  unitsFunded: number;
  status: "open" | "coming_soon" | "fully_funded";
  imagePath: string | null;
  steward: {
    id: string;
    name: string;
    type: string | null;
  };
}

export interface PlanFilters {
  search?: string;
  divisionSlug?: string;
  districtSlug?: string;
  thanaSlug?: string;
  categorySlug?: string;
  durationBucket?: "short" | "medium" | "long";
  roiBucket?: "10-15" | "15-20" | "20-30";
  status?: "open" | "coming_soon" | "fully_funded" | "all";
  sort?: "recommended" | "roi_high" | "roi_low" | "newest" | "funding";
  page?: number;
  limit?: number;
}

/** Public URL slug of an offering: plan-district-steward. */
export function buildOfferingSlug(
  planSlug: string,
  districtSlug: string,
  stewardName: string,
): string {
  const steward = stewardName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${planSlug}-${districtSlug}-${steward}`;
}

export async function listPublicOfferings(filters: PlanFilters = {}) {
  const db = createAdminClient();

  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(50, Math.max(1, filters.limit ?? 12));
  const offset = (page - 1) * limit;

  let planStatuses: string[];
  switch (filters.status) {
    case "open":
      planStatuses = ["open", "fully_funded"];
      break;
    case "coming_soon":
      planStatuses = ["coming_soon"];
      break;
    case "fully_funded":
      planStatuses = ["fully_funded"];
      break;
    case "all":
    default:
      planStatuses = ["open", "coming_soon", "fully_funded"];
      break;
  }

  let query = db
    .from("steward_plan_offerings")
    .select(
      `
      id,
      units_offered,
      units_funded,
      status,
      thana_id,
      thanas${filters.thanaSlug ? "!inner" : ""} ( name_en, name_bn, slug ),
      investment_plans!inner (
        id, slug, name_en, name_bn, image_path,
        duration_months, unit_price, animal_allocation, care_allocation,
        estimated_roi_min, estimated_roi_max,
        status,
        livestock_categories!inner ( slug, name_en, name_bn ),
        divisions!inner ( slug, name_en, name_bn ),
        districts!inner ( slug, name_en, name_bn )
      ),
      users!steward_id!inner ( id, full_name )
      `,
      { count: "exact" },
    )
    .eq("status", "approved")
    .in("investment_plans.status", planStatuses);

  // Text search on plan name (bilingual)
  if (filters.search && filters.search.trim().length > 0) {
    const q = filters.search.trim();
    query = query.or(
      `name_en.ilike.%${q}%,name_bn.ilike.%${q}%`,
      { foreignTable: "investment_plans" },
    );
  }

  if (filters.categorySlug) {
    query = query.eq("investment_plans.livestock_categories.slug", filters.categorySlug);
  }
  if (filters.divisionSlug) {
    query = query.eq("investment_plans.divisions.slug", filters.divisionSlug);
  }
  if (filters.districtSlug) {
    query = query.eq("investment_plans.districts.slug", filters.districtSlug);
  }
  if (filters.thanaSlug) {
    query = query.eq("thanas.slug", filters.thanaSlug);
  }

  // Duration bucket
  if (filters.durationBucket === "short") {
    query = query.lte("investment_plans.duration_months", 4);
  } else if (filters.durationBucket === "medium") {
    query = query
      .gte("investment_plans.duration_months", 5)
      .lte("investment_plans.duration_months", 6);
  } else if (filters.durationBucket === "long") {
    query = query.gte("investment_plans.duration_months", 7);
  }

  // ROI bucket (overlap check — any overlap counts as a match)
  if (filters.roiBucket === "10-15") {
    query = query
      .gte("investment_plans.estimated_roi_max", 10)
      .lte("investment_plans.estimated_roi_min", 15);
  } else if (filters.roiBucket === "15-20") {
    query = query
      .gte("investment_plans.estimated_roi_max", 15)
      .lte("investment_plans.estimated_roi_min", 20);
  } else if (filters.roiBucket === "20-30") {
    query = query.gte("investment_plans.estimated_roi_min", 20);
  }

  const sort = filters.sort ?? "recommended";
  switch (sort) {
    case "roi_high":
      query = query.order("estimated_roi_max", {
        foreignTable: "investment_plans",
        ascending: false,
      });
      break;
    case "roi_low":
      query = query.order("estimated_roi_min", {
        foreignTable: "investment_plans",
        ascending: true,
      });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "funding":
    case "recommended":
    default:
      query = query.order("units_funded", { ascending: false });
      break;
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) {
    console.error("[listPublicOfferings] query error:", error);
    return { items: [], total: 0, page, limit, hasMore: false };
  }

  // Supabase can't infer the shape of these joins; describe what we selected.
  type Place = { slug: string; name_en: string; name_bn: string };
  type OfferingListRow = {
    id: string;
    units_offered: number;
    units_funded: number;
    thanas: { name_en: string | null; name_bn: string | null } | null;
    users: { id: string; full_name: string | null };
    investment_plans: {
      slug: string;
      name_en: string;
      name_bn: string;
      status: OfferingListItem["status"];
      image_path: string | null;
      duration_months: number;
      estimated_roi_min: number | string;
      estimated_roi_max: number | string;
      unit_price: number | string;
      animal_allocation: number | string;
      care_allocation: number | string;
      livestock_categories: Place;
      divisions: Place;
      districts: Place;
    };
  };
  const rows = (data ?? []) as unknown as OfferingListRow[];
  const items: OfferingListItem[] = rows.map((row) => {
    const plan = row.investment_plans;
    const steward = row.users;
    return {
      offeringId: row.id,
      offeringSlug: buildOfferingSlug(
        plan.slug,
        plan.districts.slug,
        steward.full_name ?? "steward",
      ),
      planNameEn: plan.name_en,
      planNameBn: plan.name_bn,
      categorySlug: plan.livestock_categories.slug,
      categoryNameEn: plan.livestock_categories.name_en,
      categoryNameBn: plan.livestock_categories.name_bn,
      divisionNameEn: plan.divisions.name_en,
      divisionNameBn: plan.divisions.name_bn,
      districtNameEn: plan.districts.name_en,
      districtNameBn: plan.districts.name_bn,
      thanaNameEn: row.thanas?.name_en ?? null,
      thanaNameBn: row.thanas?.name_bn ?? null,
      durationMonths: plan.duration_months,
      roiMin: Number(plan.estimated_roi_min),
      roiMax: Number(plan.estimated_roi_max),
      unitPrice: Number(plan.unit_price),
      animalAllocation: Number(plan.animal_allocation),
      careAllocation: Number(plan.care_allocation),
      unitsOffered: row.units_offered,
      unitsFunded: row.units_funded,
      status: plan.status,
      imagePath: plan.image_path,
      steward: {
        id: steward.id,
        name: steward.full_name ?? "Steward",
        type: null,
      },
    };
  });

  return {
    items,
    total: count ?? 0,
    page,
    limit,
    hasMore: (count ?? 0) > offset + items.length,
  };
}

export async function findPublicOfferingBySlug(slug: string) {
  const { items } = await listPublicOfferings({ limit: 500, status: "all" });
  return items.find((o) => o.offeringSlug === slug) ?? null;
}

export async function findPublicOfferingById(id: string) {
  const { items } = await listPublicOfferings({ limit: 500, status: "all" });
  return items.find((o) => o.offeringId === id) ?? null;
}