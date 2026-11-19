import { createAdminClient } from "@/lib/supabase/admin";
import { toE164 } from "@/lib/auth/phone";

export interface InterestSubmitInput {
  offeringId: string;
  requestedUnits: number;
  message?: string;
  guestName?: string;
  guestPhone?: string;
  guestEmail?: string;
  investorId: string | null;
  ipAddress?: string;
}

export type InterestSubmitResult =
  | { ok: true; reference: string; status: string }
  | { ok: false; error: string; code?: "already_exists" | "unavailable" };

export async function submitInterest(
  input: InterestSubmitInput,
): Promise<InterestSubmitResult> {
  const db = createAdminClient();

  // 1. Validate offering
  const { data: offering } = await db
    .from("steward_plan_offerings")
    .select(
      `
      id, units_offered, units_funded, status,
      investment_plans!inner ( id, status )
      `,
    )
    .eq("id", input.offeringId)
    .eq("status", "approved")
    .maybeSingle();

  if (!offering) {
    return { ok: false, error: "This offering is no longer available.", code: "unavailable" };
  }

  const planStatus = (offering.investment_plans as unknown as { status: string } | null)?.status;
  if (planStatus !== "open" && planStatus !== "coming_soon") {
    return { ok: false, error: "This plan is not accepting investors.", code: "unavailable" };
  }

  if (!Number.isFinite(input.requestedUnits) || input.requestedUnits < 1) {
    return { ok: false, error: "Please choose at least 1 unit." };
  }
  if (input.requestedUnits > offering.units_offered) {
    return {
      ok: false,
      error: `Only ${offering.units_offered} units are offered on this plan.`,
    };
  }

  // 2. Resolve identity
  let investorId: string | null = null;
  let guestPhone: string | null = null;
  let guestName: string | null = null;
  let guestEmail: string | null = null;

  if (input.investorId) {
    const { data: user } = await db
      .from("users")
      .select("id, role, status")
      .eq("id", input.investorId)
      .maybeSingle();
    if (!user || user.role !== "investor") {
      return { ok: false, error: "Only investors can submit interest." };
    }
    if (user.status !== "active") {
      return { ok: false, error: "Your account is not active." };
    }
    investorId = user.id;
  } else {
    if (!input.guestName?.trim() || input.guestName.trim().length < 2) {
      return { ok: false, error: "Full name is required." };
    }
    if (!input.guestPhone?.trim()) {
      return { ok: false, error: "Phone number is required." };
    }
    guestPhone = toE164(input.guestPhone);
    guestName = input.guestName.trim();
    guestEmail = input.guestEmail?.trim() || null;

    // Block if an account already exists with this phone
    const { data: existingUser } = await db
      .from("users")
      .select("id, role")
      .eq("phone", guestPhone)
      .maybeSingle();
    if (existingUser) {
      return {
        ok: false,
        error:
          "An account already exists with this phone. Please log in to submit interest.",
      };
    }
  }

  // 3. Duplicate check
  if (investorId) {
    const { data: existing } = await db
      .from("investment_interests")
      .select("id, reference")
      .eq("offering_id", input.offeringId)
      .eq("investor_id", investorId)
      .in("status", ["submitted", "under_review", "approved", "onboarding"])
      .maybeSingle();
    if (existing) {
      return {
        ok: false,
        error: `You already have an active interest for this plan (${existing.reference}).`,
        code: "already_exists",
      };
    }
  } else if (guestPhone) {
    const { data: existing } = await db
      .from("investment_interests")
      .select("id, reference")
      .eq("offering_id", input.offeringId)
      .eq("guest_phone", guestPhone)
      .in("status", ["submitted", "under_review", "approved", "onboarding"])
      .maybeSingle();
    if (existing) {
      return {
        ok: false,
        error: `An interest has already been submitted for this phone (${existing.reference}).`,
        code: "already_exists",
      };
    }
  }

  // 4. Insert interest
  const { data: interest, error: insertError } = await db
    .from("investment_interests")
    .insert({
      offering_id: input.offeringId,
      investor_id: investorId,
      guest_name: guestName,
      guest_phone: guestPhone,
      guest_email: guestEmail,
      requested_units: input.requestedUnits,
      message: input.message?.trim() || null,
      status: "submitted",
    })
    .select("id, reference, status")
    .single();

  if (insertError || !interest) {
    console.error("[submitInterest] insert error:", insertError);
    return { ok: false, error: "Failed to submit interest. Please try again." };
  }

  // 5. Record agreement acceptances
  const docs = [
    "interest_acknowledgement",
    "risk_disclosure",
    "terms_of_investment",
  ] as const;
  await db.from("agreement_acceptances").insert(
    docs.map((doc) => ({
      user_id: investorId,
      interest_id: interest.id,
      document_type: doc,
      document_version: "1.0",
      ip_address: input.ipAddress ?? null,
    })),
  );

  return { ok: true, reference: interest.reference, status: interest.status };
}

export interface InterestDetail {
  id: string;
  reference: string;
  status: string;
  requestedUnits: number;
  createdAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
  /** Owner when submitted by a signed-in investor; null for guest interests. */
  investorId: string | null;
  offeringId: string;
  planNameEn: string;
  planNameBn: string;
  planImagePath: string | null;
  durationMonths: number;
  roiMin: number;
  roiMax: number;
  unitPrice: number;
  animalAllocation: number;
  careAllocation: number;
  districtNameEn: string;
  divisionNameEn: string;
  categoryNameEn: string;
  stewardName: string;
  offeringSlug: string;
}

/**
 * Public-safe view of an interest: plan, status and amounts only — never the
 * guest's name, phone or message (references are sequential and guessable).
 */
export async function getInterestByReference(
  reference: string,
): Promise<InterestDetail | null> {
  const db = createAdminClient();

  const { data, error } = await db
    .from("investment_interests")
    .select(
      `
      id, reference, status, requested_units, investor_id,
      created_at, reviewed_at, rejection_reason,
      offering:steward_plan_offerings!offering_id (
        id, units_offered, units_funded,
        investment_plans!inner (
          id, slug, name_en, name_bn, image_path,
          duration_months, estimated_roi_min, estimated_roi_max,
          unit_price, animal_allocation, care_allocation,
          status,
          divisions ( name_en ),
          districts ( name_en, slug ),
          livestock_categories ( name_en )
        ),
        users!steward_id!inner ( id, full_name )
      )
      `,
    )
    .eq("reference", reference)
    .maybeSingle();

  if (error || !data) return null;

  // Supabase can't infer the shape of these joins; describe what we selected.
  type OfferingRow = {
    id: string;
    units_offered: number;
    units_funded: number;
    investment_plans: {
      id: string;
      slug: string;
      name_en: string | null;
      name_bn: string | null;
      image_path: string | null;
      duration_months: number | null;
      estimated_roi_min: number | string | null;
      estimated_roi_max: number | string | null;
      unit_price: number | string | null;
      animal_allocation: number | string | null;
      care_allocation: number | string | null;
      status: string;
      divisions: { name_en: string | null } | null;
      districts: { name_en: string | null; slug: string | null } | null;
      livestock_categories: { name_en: string | null } | null;
    } | null;
    users: { id: string; full_name: string | null } | null;
  } | null;
  const offering = data.offering as unknown as OfferingRow;
  const plan = offering?.investment_plans;
  const steward = offering?.users;
  const stewardSlug = (steward?.full_name ?? "steward")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const offeringSlug = plan
    ? `${plan.slug}-${plan.districts?.slug ?? "district"}-${stewardSlug}`
    : "";

  return {
    id: data.id,
    reference: data.reference,
    status: data.status,
    requestedUnits: data.requested_units,
    investorId: data.investor_id,
    createdAt: data.created_at,
    reviewedAt: data.reviewed_at,
    rejectionReason: data.rejection_reason,
    offeringId: offering?.id ?? "",
    planNameEn: plan?.name_en ?? "—",
    planNameBn: plan?.name_bn ?? "—",
    planImagePath: plan?.image_path ?? null,
    durationMonths: plan?.duration_months ?? 0,
    roiMin: Number(plan?.estimated_roi_min ?? 0),
    roiMax: Number(plan?.estimated_roi_max ?? 0),
    unitPrice: Number(plan?.unit_price ?? 0),
    animalAllocation: Number(plan?.animal_allocation ?? 0),
    careAllocation: Number(plan?.care_allocation ?? 0),
    districtNameEn: plan?.districts?.name_en ?? "—",
    divisionNameEn: plan?.divisions?.name_en ?? "—",
    categoryNameEn: plan?.livestock_categories?.name_en ?? "—",
    stewardName: steward?.full_name ?? "—",
    offeringSlug,
  };
}