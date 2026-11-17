import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionFromCookie } from "./session";

export interface CurrentUser {
  id: string;
  role: "investor" | "steward" | "farmer" | "admin";
  fullName: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  avatarPath: string | null;
  kycStatus:
    | "not_started"
    | "pending"
    | "under_review"
    | "verified"
    | "rejected"
    | "requires_update";
  kycRejectionReason: string | null;
}

/**
 * Reads the current user's session cookie, loads their full profile
 * from `users`, and joins their latest KYC status from `kyc_profiles`.
 *
 * Returns null if not logged in or user not found.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSessionFromCookie();
  if (!session) return null;

  const admin = createAdminClient();

  const { data: user } = await admin
    .from("users")
    .select("id, role, full_name, phone, email, status, avatar_path")
    .eq("id", session.sub)
    .single();

  if (!user) return null;

  const { data: kyc } = await admin
    .from("kyc_profiles")
    .select("status, rejection_reason")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    role: user.role as CurrentUser["role"],
    fullName: user.full_name,
    phone: user.phone,
    email: user.email,
    status: user.status,
    avatarPath: user.avatar_path,
    kycStatus: (kyc?.status ?? "not_started") as CurrentUser["kycStatus"],
    kycRejectionReason: kyc?.rejection_reason ?? null,
  };
}

export interface WithdrawalPreference {
  method: "mobile" | "bank";
  mfsProvider: string | null;
  mobileNumber: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankBranch: string | null;
  bankRoutingNumber: string | null;
  accountHolderName: string;
}

export async function getWithdrawalPreference(
  userId: string,
): Promise<WithdrawalPreference | null> {
  const admin = createAdminClient();

  const { data } = await admin
    .from("withdrawal_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return null;

  return {
    method: data.method as "mobile" | "bank",
    mfsProvider: data.mfs_provider,
    mobileNumber: data.mobile_number,
    bankName: data.bank_name,
    bankAccountNumber: data.bank_account_number,
    bankBranch: data.bank_branch,
    bankRoutingNumber: data.bank_routing_number,
    accountHolderName: data.account_holder_name,
  };
}