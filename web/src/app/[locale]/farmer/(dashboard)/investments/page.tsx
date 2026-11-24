import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { EmptyState, PageHeader, Tabs } from "@/components/dashboard/ui";
import { FarmerBatchCard, loadFarmerBatches } from "@/components/farmer/FarmerBatchCard";

export const dynamic = "force-dynamic";

const VIEWS = ["running", "finished", "all"] as const;
type View = (typeof VIEWS)[number];

/** Every batch assigned to this farmer: running (default), finished, or all. */
export default async function FarmerBatchesPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "farmer") redirect("/login");

  const { view: viewParam } = await searchParams;
  const view: View = VIEWS.includes(viewParam as View) ? (viewParam as View) : "running";
  const t = await getTranslations("app.farmerBatches");
  const db = createAdminClient();

  const batches = await loadFarmerBatches(db, user.id);
  const ids = batches.map((b) => b.id);
  const [{ data: animals }, { data: sales }] = ids.length
    ? await Promise.all([
        db.from("animals").select("investment_id").in("investment_id", ids).in("status", ["active", "death_reported"]),
        db.from("investment_sales").select("investment_id, status").in("investment_id", ids),
      ])
    : [{ data: [] }, { data: [] }];
  const activeAnimals = new Map<string, number>();
  for (const a of animals ?? []) activeAnimals.set(a.investment_id, (activeAnimals.get(a.investment_id) ?? 0) + 1);
  const saleStatus = new Map((sales ?? []).map((s) => [s.investment_id, s.status]));

  const running = batches.filter((b) => b.stage !== "settled");
  const finished = batches.filter((b) => b.stage === "settled");
  const shown = view === "running" ? running : view === "finished" ? finished : batches;
  const href = (v: View) => (v === "running" ? "/farmer/investments" : `/farmer/investments?view=${v}`);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <Tabs
        items={[
          { label: t("running"), href: href("running"), active: view === "running", count: running.length },
          { label: t("finished"), href: href("finished"), active: view === "finished", count: finished.length },
          { label: t("all"), href: href("all"), active: view === "all", count: batches.length },
        ]}
      />

      {shown.length === 0 ? (
        <EmptyState
          icon="leaf"
          title={view === "running" ? t("emptyRunning") : view === "finished" ? t("emptyFinished") : t("emptyAll")}
          description={t("emptyHint")}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {shown.map((b) => {
            const sale = saleStatus.get(b.id);
            // Batches waiting on the farmer: buy the animals, or send the sale money.
            const needsFarmer = b.stage === "awaiting_purchase" || sale === "awaiting_remittance";
            return (
              <FarmerBatchCard
                key={b.id}
                batch={{ ...b, animalsActive: activeAnimals.get(b.id) ?? 0 }}
                highlight={needsFarmer}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
