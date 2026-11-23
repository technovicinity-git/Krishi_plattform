import { requireMobileUser, json, localeOf, translators, timelineText } from "@/lib/mobile/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { investmentRoleFor } from "@/lib/investments/access";
import { getInvestmentDetail } from "@/lib/investments/detail";
import { totalLossBlocker } from "@/lib/investments/total-loss";
import { getReviewForInvestment } from "@/lib/reviews";

export const runtime = "nodejs";

/**
 * One batch with everything its screen needs: money, sale and settlement,
 * animals, fund requests, expenses and the timeline (text in the app's
 * language). `viewerRole` tells the app which actions to offer; the action
 * APIs check everything again.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireMobileUser();
  if (user instanceof Response) return user;
  const { id } = await params;

  const access = await investmentRoleFor(user, id);
  if (!access) return json({ error: "Not found" }, 404);
  const inv = await getInvestmentDetail(id);
  if (!inv) return json({ error: "Not found" }, 404);

  const t = await translators(localeOf(request));
  const updates = inv.updates.map((u) => {
    const text = timelineText(t, { title: u.title, body: u.body, metadata: u.i18n ? { i18n: u.i18n } : null });
    return {
      id: u.id,
      type: u.updateType,
      title: text.title,
      body: text.body,
      amount: u.amount,
      photoUrl: u.photoUrl,
      authorRole: u.authorRole,
      superseded: u.superseded,
      createdAt: u.createdAt,
    };
  });

  // Where the farmer sends money (sale money, or unspent funds on a total loss).
  const needsAccounts = access.role === "farmer" && inv.sale?.status === "awaiting_remittance";
  const { data: accountRows } = needsAccounts
    ? await createAdminClient()
        .from("platform_accounts")
        .select("id, method, provider, account_name, account_number, branch_name")
        .eq("is_active", true)
    : { data: [] };

  const lossBlocker =
    access.role === "steward"
      ? totalLossBlocker({
          stage: inv.currentStage,
          animalStatuses: inv.animals.map((a) => a.status),
          pendingFundRequests: inv.fundRequests.filter((r) => r.status === "pending").length,
          saleStatus: inv.sale?.status ?? null,
        })
      : "not_steward";

  // Investors rate the steward once the batch is settled (POST /api/reviews).
  const review = access.role === "investor" ? await getReviewForInvestment(id) : null;

  // Phone numbers only for the people who need to call each other.
  const showPhones = access.role !== "investor";
  return json({
    ...inv,
    updates,
    viewerRole: access.role,
    investor: { ...inv.investor, phone: access.role === "steward" ? inv.investor.phone : null },
    farmer: inv.farmer ? { ...inv.farmer, phone: showPhones ? inv.farmer.phone : null } : null,
    sale: inv.sale
      ? { ...inv.sale, buyerPhone: access.role === "investor" ? null : inv.sale.buyerPhone }
      : null,
    platformAccounts: (accountRows ?? []).map((a) => ({
      id: a.id,
      method: a.method,
      provider: a.provider,
      accountName: a.account_name,
      accountNumber: a.account_number,
      branchName: a.branch_name,
    })),
    review,
    canReview: access.role === "investor" && inv.currentStage === "settled",
    canCloseTotalLoss: lossBlocker === null,
    totalLossBlocker: lossBlocker === "not_steward" ? null : lossBlocker,
  });
}
