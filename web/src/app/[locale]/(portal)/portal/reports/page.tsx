import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { ReportsView } from "@/components/reports/ReportsView";

export const dynamic = "force-dynamic";

export default async function InvestorReportsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "investor") redirect("/login");

  const { data } = await createAdminClient().from("investments").select("id").eq("investor_id", user.id);
  return (
    <ReportsView
      investmentIds={(data ?? []).map((r) => r.id)}
      batchHref={(id) => `/portal/investments/${id}`}
    />
  );
}
