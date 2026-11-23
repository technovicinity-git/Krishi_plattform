import { NextResponse } from "next/server";
import { listPublicOfferings, type PlanFilters } from "@/lib/public/plans";
import { planImageUrl } from "@/lib/admin/plan-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const STATUSES = ["open", "coming_soon", "fully_funded", "all"] as const;
const SORTS = ["recommended", "roi_high", "roi_low", "newest", "funding"] as const;

/**
 * Public plan listing for the app (no sign-in needed), same data as /plans.
 * GET ?search=&category=<slug>&status=open|coming_soon|fully_funded|all&sort=&page=
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const pick = <T extends string>(v: string | null, allowed: readonly T[]) =>
    v && (allowed as readonly string[]).includes(v) ? (v as T) : undefined;

  const filters: PlanFilters = {
    search: q.get("search")?.trim() || undefined,
    categorySlug: q.get("category") || undefined,
    status: pick(q.get("status"), STATUSES) ?? "open",
    sort: pick(q.get("sort"), SORTS),
    page: Math.max(1, Number(q.get("page")) || 1),
    limit: 20,
  };

  const [list, { data: categories }] = await Promise.all([
    listPublicOfferings(filters),
    createAdminClient()
      .from("livestock_categories")
      .select("slug, name_en, name_bn")
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  return NextResponse.json(
    {
      items: list.items.map((o) => ({
        ...o,
        imageUrl: planImageUrl(o.imagePath),
        unitsLeft: Math.max(0, o.unitsOffered - o.unitsFunded),
      })),
      total: list.total,
      page: list.page,
      hasMore: list.hasMore,
      categories: (categories ?? []).map((c) => ({ slug: c.slug, nameEn: c.name_en, nameBn: c.name_bn ?? c.name_en })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
