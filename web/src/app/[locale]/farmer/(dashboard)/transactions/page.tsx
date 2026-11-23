import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { TransactionsView } from "@/components/transactions/TransactionsView";

export const dynamic = "force-dynamic";

/** Farmer: funds released, sale money sent, profit shares and withdrawals. */
export default async function FarmerTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "farmer") redirect("/login");

  return (
    <TransactionsView
      scope={{ kind: "user", userId: user.id, role: "farmer" }}
      searchParams={await searchParams}
      basePath="/farmer/transactions"
      batchHref={(id) => `/farmer/investments/${id}`}
    />
  );
}
