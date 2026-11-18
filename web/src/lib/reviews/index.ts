import { createAdminClient } from "@/lib/supabase/admin";

export interface StewardRating {
  avg: number;
  count: number;
}

export interface PublicReview {
  id: string;
  rating: number;
  comment: string | null;
  /** First name + last initial, e.g. "Rahim K." — never the full name. */
  reviewer: string;
  planEn: string;
  planBn: string;
  createdAt: string;
}

export interface InvestmentReview {
  id: string;
  rating: number;
  comment: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/** "Rahim Karim" → "Rahim K."; "Rahim" → "Rahim". */
export function shortName(full: string | null | undefined): string {
  const parts = (full ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Investor";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

/** Average rating and count of published reviews, per steward. Server-only. */
export async function getStewardRatings(stewardIds: string[]): Promise<Map<string, StewardRating>> {
  const out = new Map<string, StewardRating>();
  if (stewardIds.length === 0) return out;
  const { data } = await createAdminClient()
    .from("steward_reviews")
    .select("steward_id, rating")
    .in("steward_id", stewardIds)
    .eq("status", "published");
  const sums = new Map<string, { total: number; count: number }>();
  for (const r of data ?? []) {
    const s = sums.get(r.steward_id) ?? { total: 0, count: 0 };
    s.total += r.rating;
    s.count += 1;
    sums.set(r.steward_id, s);
  }
  for (const [id, s] of sums) {
    out.set(id, { avg: Math.round((s.total / s.count) * 10) / 10, count: s.count });
  }
  return out;
}

/** Latest published reviews of one steward, safe to show publicly. Server-only. */
export async function getStewardReviews(stewardId: string, limit = 20): Promise<PublicReview[]> {
  const { data } = await createAdminClient()
    .from("steward_reviews")
    .select(`
      id, rating, comment, created_at,
      investor:users!investor_id ( full_name ),
      investment:investments!investment_id (
        offering:steward_plan_offerings!offering_id ( investment_plans ( name_en, name_bn ) )
      )
    `)
    .eq("steward_id", stewardId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((r) => {
    const plan = (
      r.investment as unknown as {
        offering: { investment_plans: { name_en: string | null; name_bn: string | null } | null } | null;
      } | null
    )?.offering?.investment_plans;
    return {
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      reviewer: shortName((r.investor as unknown as { full_name: string | null } | null)?.full_name),
      planEn: plan?.name_en ?? "",
      planBn: plan?.name_bn ?? plan?.name_en ?? "",
      createdAt: r.created_at,
    };
  });
}

/** The investor's own review of one investment, if any. Server-only. */
export async function getReviewForInvestment(investmentId: string): Promise<InvestmentReview | null> {
  const { data } = await createAdminClient()
    .from("steward_reviews")
    .select("id, rating, comment, status, created_at, updated_at")
    .eq("investment_id", investmentId)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    rating: data.rating,
    comment: data.comment,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
