import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { TransactionsView } from "@/components/transactions/TransactionsView";

export const dynamic = "force-dynamic";

/** Steward: profit shares, adjustments and withdrawals. */
export default async function StewardTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "steward") redirect("/login");

  return (
    <TransactionsView
      scope={{ kind: "user", userId: user.id, role: "steward" }}
      searchParams={await searchParams}
      basePath="/steward/transactions"
      batchHref={(id) => `/steward/investments/${id}`}
    />
  );
}
