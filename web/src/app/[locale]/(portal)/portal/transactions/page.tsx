import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { TransactionsView } from "@/components/transactions/TransactionsView";

export const dynamic = "force-dynamic";

/** Investor: payments to Krishi, refunds, payouts and withdrawals. */
export default async function InvestorTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "investor") redirect("/login");

  return (
    <TransactionsView
      scope={{ kind: "user", userId: user.id, role: "investor" }}
      searchParams={await searchParams}
      basePath="/portal/transactions"
      batchHref={(id) => `/portal/investments/${id}`}
    />
  );
}
