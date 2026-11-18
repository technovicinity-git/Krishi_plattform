import { createAdminClient } from "@/lib/supabase/admin";
import { releasedFunds } from "./settlement";
import { signFileUrls } from "@/lib/storage/private-files";

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
    categoryNameBn: string;
    districtName: string;
    districtNameBn: string;
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
  expenses: Array<{
    id: string;
    amount: number;
    category: string;
    description: string | null;
    receiptPath: string | null;
    /** Short-lived signed link to the receipt image. */
    receiptUrl: string | null;
    status: string;
    rejectionReason: string | null;
    createdAt: string;
  }>;
  sale: InvestmentSale | null;
  settlement: InvestmentSettlement | null;
  updates: Array<{
    id: string;
    updateType: string;
    title: string;
    body: string | null;
    photoPath: string | null;
    photoUrl: string | null;
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

export interface InvestmentSale {
  id: string;
  reference: string;
  animalsSold: number;
  saleAmount: number;
  buyerName: string | null;
  buyerPhone: string | null;
  saleDate: string;
  note: string | null;
  photoPath: string | null;
  photoUrl: string | null;
  status: string;
  rejectionReason: string | null;
  reviewedAt: string | null;
  remitMethod: string | null;
  remitTxnId: string | null;
  remitSender: string | null;
  remitNote: string | null;
  remitProofPath: string | null;
  remitProofUrl: string | null;
  remittedAt: string | null;
  remitRejectionReason: string | null;
  receivedAt: string | null;
  createdAt: string;
}

export interface InvestmentSettlement {
  capital: number;
  fundsReleased: number;
  saleAmount: number;
  totalReturn: number;
  netResult: number;
  outcome: "profit" | "loss" | "break_even";
  investorPayout: number;
  farmerShare: number;
  stewardShare: number;
  platformShare: number;
  note: string | null;
  settledAt: string;
}

const SALE_COLUMNS =
  "id, reference, animals_sold, sale_amount, buyer_name, buyer_phone, sale_date, note, photo_path, status, rejection_reason, reviewed_at, remit_method, remit_txn_id, remit_sender, remit_note, remit_proof_path, remitted_at, remit_rejection_reason, received_at, created_at";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSale(row: any, urls: Map<string, string> = new Map()): InvestmentSale {
  return {
    id: row.id,
    reference: row.reference,
    animalsSold: row.animals_sold,
    saleAmount: Number(row.sale_amount),
    buyerName: row.buyer_name,
    buyerPhone: row.buyer_phone,
    saleDate: row.sale_date,
    note: row.note,
    photoPath: row.photo_path,
    photoUrl: urls.get(row.photo_path) ?? null,
    status: row.status,
    rejectionReason: row.rejection_reason,
    reviewedAt: row.reviewed_at,
    remitMethod: row.remit_method,
    remitTxnId: row.remit_txn_id,
    remitSender: row.remit_sender,
    remitNote: row.remit_note,
    remitProofPath: row.remit_proof_path,
    remitProofUrl: urls.get(row.remit_proof_path) ?? null,
    remittedAt: row.remitted_at,
    remitRejectionReason: row.remit_rejection_reason,
    receivedAt: row.received_at,
    createdAt: row.created_at,
  };
}

export { SALE_COLUMNS };

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
          livestock_categories ( name_en, name_bn ),
          districts ( name_en, name_bn )
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
  const fundsDisbursed = releasedFunds(
    (fundReqs ?? []).map((r) => ({ status: r.status, amount: Number(r.amount) })),
  );

  const [{ data: expenseRows }, { data: saleRow }, { data: settlementRow }] = await Promise.all([
    db
      .from("expenses")
      .select("id, amount, category, description, receipt_path, status, rejection_reason, created_at")
      .eq("investment_id", investmentId)
      .order("created_at", { ascending: false }),
    db.from("investment_sales").select(SALE_COLUMNS).eq("investment_id", investmentId).maybeSingle(),
    db
      .from("investment_settlements")
      .select("capital, funds_released, sale_amount, total_return, net_result, outcome, investor_payout, farmer_share, steward_share, platform_share, note, settled_at")
      .eq("investment_id", investmentId)
      .maybeSingle(),
  ]);
  const expAgg = (expenseRows ?? []).filter((e) => e.status === "approved");

  const expensesApproved =
    (expAgg ?? []).reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const careBudgetUsed =
    (expAgg ?? [])
      .filter((e) => e.category !== "animal_purchase")
      .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

  // Photos and receipts are private: sign every path shown on this page.
  const urls = await signFileUrls([
    ...(updatesData ?? []).map((u) => u.photo_path),
    ...(expenseRows ?? []).map((e) => e.receipt_path),
    saleRow?.photo_path,
    saleRow?.remit_proof_path,
  ]);

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
      categoryNameBn: plan?.livestock_categories?.name_bn ?? plan?.livestock_categories?.name_en ?? "—",
      districtName: plan?.districts?.name_en ?? "—",
      districtNameBn: plan?.districts?.name_bn ?? plan?.districts?.name_en ?? "—",
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
    expenses: (expenseRows ?? []).map((e) => ({
      id: e.id,
      amount: Number(e.amount),
      category: e.category,
      description: e.description,
      receiptPath: e.receipt_path,
      receiptUrl: e.receipt_path ? urls.get(e.receipt_path) ?? null : null,
      status: e.status,
      rejectionReason: e.rejection_reason,
      createdAt: e.created_at,
    })),
    sale: saleRow ? mapSale(saleRow, urls) : null,
    settlement: settlementRow
      ? {
          capital: Number(settlementRow.capital),
          fundsReleased: Number(settlementRow.funds_released),
          saleAmount: Number(settlementRow.sale_amount),
          totalReturn: Number(settlementRow.total_return),
          netResult: Number(settlementRow.net_result),
          outcome: settlementRow.outcome as InvestmentSettlement["outcome"],
          investorPayout: Number(settlementRow.investor_payout),
          farmerShare: Number(settlementRow.farmer_share),
          stewardShare: Number(settlementRow.steward_share),
          platformShare: Number(settlementRow.platform_share),
          note: settlementRow.note,
          settledAt: settlementRow.settled_at,
        }
      : null,
    updates: (updatesData ?? []).map((u) => ({
      id: u.id,
      updateType: u.update_type,
      title: u.title,
      body: u.body,
      photoPath: u.photo_path,
      photoUrl: u.photo_path ? urls.get(u.photo_path) ?? null : null,
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