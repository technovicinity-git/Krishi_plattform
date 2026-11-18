import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getStewardInvestmentIds } from "@/lib/steward/investments";
import { ReportsView } from "@/components/reports/ReportsView";

export const dynamic = "force-dynamic";

export default async function StewardReportsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "steward") redirect("/login");

  return (
    <ReportsView
      investmentIds={await getStewardInvestmentIds(user.id)}
      batchHref={(id) => `/steward/investments/${id}`}
    />
  );
}
