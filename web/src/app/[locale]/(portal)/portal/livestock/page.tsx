import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAnimalsForInvestments } from "@/lib/animals";
import { LivestockView, parseLivestockFilter } from "@/components/animals/LivestockView";

export const dynamic = "force-dynamic";

export default async function InvestorLivestockPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "investor") redirect("/login");

  const { data } = await createAdminClient().from("investments").select("id").eq("investor_id", user.id);
  const ids = (data ?? []).map((r) => r.id);
  const animals = await getAnimalsForInvestments(ids);
  const { status } = await searchParams;

  return (
    <LivestockView
      animals={animals}
      filter={parseLivestockFilter(status)}
      basePath="/portal/livestock"
      batchHref={(id) => `/portal/investments/${id}`}
      showFarmer={false}
    />
  );
}
