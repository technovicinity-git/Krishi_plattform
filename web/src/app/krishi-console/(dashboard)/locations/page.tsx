import { requireAdmin } from "@/lib/admin/current-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminLocationsPage() {
  await requireAdmin();
  const db = createAdminClient();

  const { data: divisions } = await db
    .from("divisions")
    .select("id, slug, name_en, name_bn, sort_order")
    .order("sort_order", { ascending: true });

  const { data: districts } = await db
    .from("districts")
    .select("id, division_id, slug, name_en, name_bn, sort_order")
    .order("sort_order", { ascending: true });

  const districtsByDivision = new Map<string, typeof districts>();
  for (const d of districts ?? []) {
    const arr = districtsByDivision.get(d.division_id) ?? [];
    arr.push(d);
    districtsByDivision.set(d.division_id, arr);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-[28px] leading-tight text-ink">
          Locations
        </h1>
        <p className="text-[13px] text-ink-secondary">
          Divisions and districts used when creating investment plans. This
          list is fixed — 8 divisions, 64 districts.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {(divisions ?? []).map((div) => {
          const list = districtsByDivision.get(div.id) ?? [];
          return (
            <div
              key={div.id}
              className="flex flex-col gap-3 rounded-2xl border border-border-light bg-white p-6"
            >
              <div className="flex items-center justify-between gap-3 border-b border-border-light pb-3">
                <div className="flex flex-col">
                  <span className="font-serif text-[18px] text-ink">
                    {div.name_en}
                  </span>
                  <span className="text-[12px] text-ink-muted">
                    {div.name_bn}
                  </span>
                </div>
                <span className="rounded-[4px] bg-stone px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.02em] text-ink-secondary">
                  {list.length} districts
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {list.map((d) => (
                  <span
                    key={d.id}
                    className="inline-flex items-center rounded-[6px] border border-border-light bg-cream px-3 py-1.5 text-[12px] font-medium text-ink-secondary"
                  >
                    {d.name_en}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}