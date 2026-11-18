import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getStewardInvestmentIds } from "@/lib/steward/investments";
import { getAnimalsForInvestments } from "@/lib/animals";
import { LivestockView, parseLivestockFilter } from "@/components/animals/LivestockView";

export const dynamic = "force-dynamic";

export default async function StewardLivestockPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "steward") redirect("/login");

  const ids = await getStewardInvestmentIds(user.id);
  const animals = await getAnimalsForInvestments(ids);
  const { status } = await searchParams;

  return (
    <LivestockView
      animals={animals}
      filter={parseLivestockFilter(status)}
      basePath="/steward/livestock"
      batchHref={(id) => `/steward/investments/${id}`}
      showFarmer={true}
    />
  );
}
