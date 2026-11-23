import { requireAdmin } from "@/lib/admin/current-admin";
import { TransactionsView } from "@/components/transactions/TransactionsView";

export const dynamic = "force-dynamic";

/** Admin: every money movement on the platform, as money in and out of Krishi. */
export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  return (
    <TransactionsView
      scope={{ kind: "platform" }}
      searchParams={await searchParams}
      basePath="/krishi-console/transactions"
      batchHref={() => null}
      localized={false}
    />
  );
}
