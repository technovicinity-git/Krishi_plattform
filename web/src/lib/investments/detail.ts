import { createAdminClient } from "@/lib/supabase/admin";

export interface InvestmentDetail {
  id: string;
  reference: string;
  units: number;
  amount: number;
  status: string;
  currentStage: string;
  createdAt: string;
  investor: { id: string; fullName: string | null; phone: string | null };
  farmer: { id: string; fullName: string | null; phone: string | null } | null;
  steward: { id: string; fullName: string | null };
  offering: {
    id: string;
    planNameEn: string;
    planNameBn: string;
    durationMonths: number;
    roiMin: number;
    roiMax: number;
    unitPrice: number;
    animalAllocation: number;
    careAllocation: number;
    imagePath: string | null;
    categoryName: string;
    districtName: string;
  };
  fundRequests: Array<{
    id: string;
    reference: string;
    amount: number;
    purpose: string;
    status: string;
    createdAt: string;
    rejectionReason: string | null;
  }>;
  updates: Array<{
    id: string;
    updateType: string;
    title: string;
    body: string | null;
    photoPath: string | null;
    amount: number | null;
    createdAt: string;
    authorRole: string | null;
  }>;
  stats: {
    animalBudgetTotal: number;
    careBudgetTotal: number;
    careBudgetUsed: number;
    careBudgetRemaining: number;
    fundsDisbursed: number;
    expensesApproved: number;
  };
}

export async function getInvestmentDetail(
  investmentId: string,
): Promise<InvestmentDetail | null> {
  const db = createAdminClient();

  const { data, error } = await db
    .from("investments")
    .select(
      `
      id, reference, units, amount, status, current_stage, created_at,
      investor:users!investor_id ( id, full_name, phone ),
      farmer:users!farmer_id ( id, full_name, phone ),
      offering:steward_plan_offerings!offering_id (
        id,
        users!steward_id!inner ( id, full_name ),
        investment_plans!inner (
          name_en, name_bn, duration_months,
          estimated_roi_min, estimated_roi_max,
          unit_price, animal_allocation, care_allocation, image_path,
          livestock_categories ( name_en ),
          districts ( name_en )
        )
      )
      `,
    )
    .eq("id", investmentId)
    .maybeSingle();

  if (error || !data) return null;

  const offering: any = data.offering;
  const plan: any = offering?.investment_plans;
  const steward: any = offering?.users;
  const investor: any = data.investor;
  const farmer: any = data.farmer;

  // Fetch fund requests
  const { data: fundReqs } = await db
    .from("fund_requests")
    .select("id, reference, amount, purpose, status, created_at, rejection_reason")
    .eq("investment_id", investmentId)
    .order("created_at", { ascending: false });

  // Fetch updates
  const { data: updatesData } = await db
    .from("investment_updates")
    .select("id, update_type, title, body, photo_path, amount, created_at, author_role")
    .eq("investment_id", investmentId)
    .order("created_at", { ascending: false })
    .limit(50);

  // Compute stats
  const animalBudgetTotal = Number(plan?.animal_allocation ?? 0) * data.units;
  const careBudgetTotal = Number(plan?.care_allocation ?? 0) * data.units;
  const fundsDisbursed =
    (fundReqs ?? [])
      .filter((r) => r.status === "disbursed" || r.status === "approved")
      .reduce((sum, r) => sum + Number(r.amount), 0) || 0;

  // Fetch approved expenses sum
  const { data: expAgg } = await db
    .from("expenses")
    .select("amount, category")
    .eq("investment_id", investmentId)
    .eq("status", "approved");

  const expensesApproved =
    (expAgg ?? []).reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const careBudgetUsed =
    (expAgg ?? [])
      .filter((e) => e.category !== "animal_purchase")
      .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

  return {
    id: data.id,
    reference: data.reference,
    units: data.units,
    amount: Number(data.amount),
    status: data.status,
    currentStage: data.current_stage,
    createdAt: data.created_at,
    investor: {
      id: investor?.id ?? "",
      fullName: investor?.full_name ?? null,
      phone: investor?.phone ?? null,
    },
    farmer: farmer
      ? {
          id: farmer.id,
          fullName: farmer.full_name,
          phone: farmer.phone,
        }
      : null,
    steward: {
      id: steward?.id ?? "",
      fullName: steward?.full_name ?? null,
    },
    offering: {
      id: offering?.id ?? "",
      planNameEn: plan?.name_en ?? "—",
      planNameBn: plan?.name_bn ?? "—",
      durationMonths: plan?.duration_months ?? 0,
      roiMin: Number(plan?.estimated_roi_min ?? 0),
      roiMax: Number(plan?.estimated_roi_max ?? 0),
      unitPrice: Number(plan?.unit_price ?? 0),
      animalAllocation: Number(plan?.animal_allocation ?? 0),
      careAllocation: Number(plan?.care_allocation ?? 0),
      imagePath: plan?.image_path ?? null,
      categoryName: plan?.livestock_categories?.name_en ?? "—",
      districtName: plan?.districts?.name_en ?? "—",
    },
    fundRequests: (fundReqs ?? []).map((r) => ({
      id: r.id,
      reference: r.reference,
      amount: Number(r.amount),
      purpose: r.purpose,
      status: r.status,
      createdAt: r.created_at,
      rejectionReason: r.rejection_reason,
    })),
    updates: (updatesData ?? []).map((u) => ({
      id: u.id,
      updateType: u.update_type,
      title: u.title,
      body: u.body,
      photoPath: u.photo_path,
      amount: u.amount ? Number(u.amount) : null,
      createdAt: u.created_at,
      authorRole: u.author_role,
    })),
    stats: {
      animalBudgetTotal,
      careBudgetTotal,
      careBudgetUsed,
      careBudgetRemaining: careBudgetTotal - careBudgetUsed,
      fundsDisbursed,
      expensesApproved,
    },
  };
}