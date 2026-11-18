/**
 * Row shapes returned by the steward portal's Supabase queries. The admin
 * client is untyped, so pages cast query results to these at the boundary.
 */

export interface PlanNames {
  name_en: string | null;
  name_bn: string | null;
}

export interface OfferingWithPlan {
  id?: string;
  investment_plans: PlanNames | null;
}

export interface StewardInvestmentRow {
  id: string;
  reference: string;
  units: number;
  current_stage: string;
  investor: { full_name: string | null } | null;
  farmer: { full_name: string | null } | null;
  offering: OfferingWithPlan | null;
}

export interface StewardInterestRow {
  id: string;
  reference: string;
  status: string;
  requested_units: number;
  guest_name: string | null;
  guest_phone: string | null;
  rejection_reason: string | null;
  investor: { full_name: string | null; phone: string | null } | null;
  offering: OfferingWithPlan | null;
}

export interface FarmerOption {
  id: string;
  full_name: string | null;
}
