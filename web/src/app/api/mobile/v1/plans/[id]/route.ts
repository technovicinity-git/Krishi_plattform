import { NextResponse } from "next/server";
import { findPublicOfferingById } from "@/lib/public/plans";
import { planImageUrl } from "@/lib/admin/plan-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getStewardRatings, getStewardReviews } from "@/lib/reviews";

export const runtime = "nodejs";

/**
 * One public offering (by offering id) with the plan's description, risks,
 * the steward's rating and recent reviews. For a signed-in investor it also
 * returns their open interest on this offering, if any.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const offering = await findPublicOfferingById(id);
  if (!offering) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  const db = createAdminClient();
  const user = await getCurrentUser();
  const [{ data: plan }, ratings, reviews, { data: interest }] = await Promise.all([
    db
      .from("steward_plan_offerings")
      .select("investment_plans ( description_en, description_bn, risk_information )")
      .eq("id", id)
      .maybeSingle(),
    getStewardRatings([offering.steward.id]),
    getStewardReviews(offering.steward.id, 5),
    user?.role === "investor"
      ? db
          .from("investment_interests")
          .select("reference, status, requested_units")
          .eq("offering_id", id)
          .eq("investor_id", user.id)
          .in("status", ["submitted", "under_review", "approved", "onboarding"])
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const text = (plan?.investment_plans as unknown as {
    description_en: string | null;
    description_bn: string | null;
    risk_information: string | null;
  } | null) ?? null;
  const rating = ratings.get(offering.steward.id);

  return NextResponse.json(
    {
      ...offering,
      imageUrl: planImageUrl(offering.imagePath),
      unitsLeft: Math.max(0, offering.unitsOffered - offering.unitsFunded),
      descriptionEn: text?.description_en ?? null,
      descriptionBn: text?.description_bn ?? text?.description_en ?? null,
      riskInformation: text?.risk_information ?? null,
      stewardRating: rating ? { avg: rating.avg, count: rating.count } : null,
      reviews,
      myInterest: interest
        ? { reference: interest.reference, status: interest.status, units: interest.requested_units }
        : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
