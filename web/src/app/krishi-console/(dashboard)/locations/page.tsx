import { requireAdmin } from "@/lib/admin/current-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader, StatCard } from "@/components/dashboard/ui";
import { LocationsExplorer, type DivisionView } from "@/components/admin/LocationsExplorer";

export const dynamic = "force-dynamic";

/** Every row of a table, paging past the API's 1,000-row limit. */
async function all<T>(fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null }>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await fetchPage(from, from + 999);
    rows.push(...(data ?? []));
    if ((data ?? []).length < 1000) return rows;
  }
}

/**
 * Divisions, districts and thanas (fixed reference data) with where Krishi is
 * active: plans and stewards per district, and offerings per thana.
 */
export default async function AdminLocationsPage() {
  await requireAdmin();
  const db = createAdminClient();

  const [{ data: divisions }, { data: districts }, thanas, { data: plans }, { data: stewards }, { data: offerings }] =
    await Promise.all([
      db.from("divisions").select("id, name_en, name_bn, sort_order").order("sort_order"),
      db.from("districts").select("id, division_id, name_en, name_bn, sort_order").order("sort_order"),
      all((from, to) =>
        db.from("thanas").select("id, district_id, name_en, name_bn, sort_order").order("sort_order").order("id").range(from, to),
      ),
      db.from("investment_plans").select("district_id"),
      db.from("steward_profiles").select("district_id"),
      db.from("steward_plan_offerings").select("thana_id").not("thana_id", "is", null),
    ]);

  const tally = (ids: (string | null)[]) => {
    const m = new Map<string, number>();
    for (const id of ids) if (id) m.set(id, (m.get(id) ?? 0) + 1);
    return m;
  };
  const plansBy = tally((plans ?? []).map((p) => p.district_id));
  const stewardsBy = tally((stewards ?? []).map((s) => s.district_id));
  const offeringsBy = tally((offerings ?? []).map((o) => o.thana_id));

  const view: DivisionView[] = (divisions ?? []).map((div) => ({
    id: div.id,
    nameEn: div.name_en,
    nameBn: div.name_bn,
    districts: (districts ?? [])
      .filter((d) => d.division_id === div.id)
      .map((d) => ({
        id: d.id,
        nameEn: d.name_en,
        nameBn: d.name_bn,
        plans: plansBy.get(d.id) ?? 0,
        stewards: stewardsBy.get(d.id) ?? 0,
        thanas: thanas
          .filter((t) => t.district_id === d.id)
          .map((t) => ({ id: t.id, nameEn: t.name_en, nameBn: t.name_bn, offerings: offeringsBy.get(t.id) ?? 0 })),
      })),
  }));

  const activeDistricts = view.flatMap((d) => d.districts).filter((d) => d.plans > 0 || d.stewards > 0).length;
  const districtCount = districts?.length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Locations"
        description="Bangladesh's divisions, districts and thanas, used for plans, stewards and offerings. The list is fixed; this page shows where Krishi is active."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Divisions" value={view.length} icon="map" />
        <StatCard label="Districts" value={districtCount} icon="map" />
        <StatCard label="Thanas" value={thanas.length} icon="map" />
        <StatCard
          label="Active districts"
          value={activeDistricts}
          icon="leaf"
          tone="brand"
          hint={`${districtCount ? Math.round((activeDistricts / districtCount) * 100) : 0}% have a plan or steward`}
        />
      </div>

      <LocationsExplorer divisions={view} />
    </div>
  );
}
